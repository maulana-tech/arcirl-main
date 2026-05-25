// Signal engine — autonomous decision producer.
//
// Triggered every ~5 minutes by Supabase pg_cron (configured separately).
// Reads recent activity from tracked smart wallets + market context, asks
// Claude to produce structured trading signals, persists them to
// public.signals so the client can stream via Supabase Realtime.
//
// When ANTHROPIC_API_KEY is missing the engine falls back to deterministic
// stub signals so the rest of the product remains demoable.
//
// POST body (optional):
//   { sourceWallets?: string[], maxSignals?: number }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NVIDIA_KEY = Deno.env.get("NVIDIA_API_KEY");
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const LLM_KEY = NVIDIA_KEY || ANTHROPIC_KEY;
const LLM_PROVIDER = LLM_KEY
  ? (Deno.env.get("LLM_PROVIDER") || (NVIDIA_KEY ? "nvidia" : "anthropic"))
  : null;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NVIDIA_MODEL = "meta/llama-3.3-70b-instruct";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const MODEL = Deno.env.get("LLM_MODEL") || (LLM_PROVIDER === "nvidia" ? NVIDIA_MODEL : ANTHROPIC_MODEL);

interface SignalRow {
  venue: "hyperliquid" | "polymarket" | "onchain";
  market_id: string;
  market_label: string | null;
  side: "BUY" | "SELL" | "HOLD";
  size_suggested_usdc: number | null;
  edge_estimate: number | null;
  confidence: number;
  reasoning_trace: string;
  trace_hash: string | null;
  arc_tx_hash: string | null;
  source_wallets: string[];
  model: string;
  is_stub: boolean;
  expires_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const sourceWallets: string[] = body.sourceWallets ?? [];
    const maxSignals: number = Math.min(Number(body.maxSignals ?? 3), 10);

    const context = await gatherContext(supabase, sourceWallets);

    let signals: SignalRow[];
    const hasWallets = context.wallets.length > 0;
    if (LLM_KEY && hasWallets) {
      try {
        signals = await callLLM(context, maxSignals);
      } catch (e) {
        console.error("LLM call failed, falling back to stub:", e);
        signals = stubSignals(context, maxSignals);
      }
    } else {
      signals = stubSignals(context, maxSignals);
    }

    // Hash + persist. The trace_hash placeholder is computed locally; real Arc
    // tx pinning happens client-side once Arc wallet is wired.
    const enriched = await Promise.all(signals.map(async (s) => ({
      ...s,
      trace_hash: await sha256(s.reasoning_trace),
    })));

    const { error } = await supabase.from("signals").insert(enriched);
    if (error) {
      return json({ error: "Insert failed", details: error.message }, 500);
    }

    return json({ inserted: enriched.length, isStub: !LLM_KEY });
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});

async function gatherContext(supabase: any, sourceWallets: string[]) {
  let wallets: { address: string; venue: string; label: string | null }[] = [];
  if (sourceWallets.length > 0) {
    wallets = sourceWallets.map((a) => ({ address: a, venue: "hyperliquid", label: null }));
  } else {
    wallets = (await supabase.from("tracked_wallets").select("address, venue, label").limit(50)).data ?? [];
    // Fallback: pull seed leaderboard from hyperliquid-fetch if DB is empty
    if (wallets.length === 0) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/hyperliquid-fetch?action=leaderboard&limit=10`, {
          headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        });
        if (res.ok) {
          const body = await res.json();
          if (body.traders?.length > 0) {
            wallets = body.traders.map((t: any) => ({
              address: t.address,
              venue: "hyperliquid",
              label: `HL trader #${t.address.slice(0, 6)}`,
            }));
          }
        }
      } catch { /* swallow */ }
    }
  }

  // Fetch PM markets for context (free public endpoint, cheap call).
  let markets: any[] = [];
  try {
    const res = await fetch("https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=20&order=volume&ascending=false");
    if (res.ok) markets = await res.json();
  } catch { /* swallow */ }

  return { wallets, markets: markets.slice(0, 20) };
}

async function callLLM(context: any, maxSignals: number): Promise<SignalRow[]> {
  const systemPrompt = `You are the Smart Money Copy Agent — an autonomous trading analyst for prediction markets (Polymarket), perpetual futures (Hyperliquid), and onchain swaps (Arc). You watch smart-money wallets and propose +EV trades when their moves align with market mispricing.

Output strict JSON only, no prose. Schema:
{
  "signals": [
    {
      "venue": "polymarket" | "hyperliquid" | "onchain",
      "market_id": string (for Polymarket, use the condition_id field from the market list),
      "market_label": string,
      "side": "BUY" | "SELL" | "HOLD",
      "size_suggested_usdc": number,
      "edge_estimate": number (0..1),
      "confidence": number (0..100),
      "reasoning_trace": string (multi-paragraph reasoning, cite source wallets and market signals),
      "source_wallets": [addr, ...]
    }
  ]
}

Be skeptical. Prefer fewer high-conviction signals over many low-confidence ones. Reject markets with no edge.`;

  const userPrompt = `Smart wallets currently tracked:
${JSON.stringify(context.wallets, null, 2)}

Active Polymarket markets (top by volume):
${JSON.stringify(context.markets.map((m: any) => ({
  condition_id: m.condition_id ?? m.id,
  q: m.question,
  vol: m.volume,
  end: m.end_date_iso
})), null, 2)}

Produce up to ${maxSignals} actionable signals.`;

  const text = LLM_PROVIDER === "nvidia"
    ? await callNvidia(systemPrompt, userPrompt, 4096, NVIDIA_MODEL)
    : await callAnthropic(systemPrompt, userPrompt, 4096, ANTHROPIC_MODEL);

  // Try to extract JSON — handle markdown fences and leading/trailing prose
  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) jsonStr = jsonStr.slice(braceStart, braceEnd + 1);

  let parsed: { signals?: any[] } = {};
  try { parsed = JSON.parse(jsonStr); } catch { parsed = {}; }
  const list = parsed.signals ?? [];

  return list.slice(0, maxSignals).map((s: any) => ({
    venue: s.venue,
    market_id: String(s.market_id),
    market_label: s.market_label ?? null,
    side: s.side,
    size_suggested_usdc: Number(s.size_suggested_usdc ?? 0),
    edge_estimate: Number(s.edge_estimate ?? 0),
    confidence: Number(s.confidence ?? 50),
    reasoning_trace: String(s.reasoning_trace ?? ""),
    trace_hash: null,
    arc_tx_hash: null,
    source_wallets: Array.isArray(s.source_wallets) ? s.source_wallets : [],
    model: MODEL,
    is_stub: false,
    expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
  }));
}

async function callAnthropic(system: string, user: string, maxTokens: number, model: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "{}";
}

async function callNvidia(system: string, user: string, maxTokens: number, model: string): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_KEY!}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "{}";
}

function stubSignals(context: any, maxSignals: number): SignalRow[] {
  const picks = context.markets.length > 0
    ? context.markets.slice(0, maxSignals)
    : Array.from({ length: maxSignals }, (_, i) => ({
        id: `demo-${i}`,
        question: i === 0 ? "Will BTC reach $100k by June 2026?" : i === 1 ? "Will ETH flip BTC this cycle?" : `Demo market ${i + 1}`,
        volume: "10000000",
      }));
  const wallets = context.wallets.slice(0, 3).map((w: any) => w.address ?? w);

  return picks.map((m: any, i: number) => {
    const sides: SignalRow["side"][] = ["BUY", "SELL", "HOLD"];
    const side = sides[i % 3];
    return {
      venue: "polymarket",
      market_id: String(m.condition_id ?? m.id ?? `stub-${i}`),  // condition_id first
      market_label: m.question ?? `Stub market #${i + 1}`,
      side,
      size_suggested_usdc: 25,
      edge_estimate: 0.05 + i * 0.02,
      confidence: 55 + i * 5,
      reasoning_trace: `STUB SIGNAL — LLM key not configured. Selected by 24h volume rank (#${i + 1}, $${Number(m.volume ?? 0).toLocaleString()}). Source wallets sampled: ${wallets.join(", ") || "none tracked yet"}. Set NVIDIA_API_KEY or ANTHROPIC_API_KEY for real LLM-backed reasoning.`,
      trace_hash: null,
      arc_tx_hash: null,
      source_wallets: wallets,
      model: "stub",
      is_stub: true,
      expires_at: new Date(Date.now() + 1 * 3600_000).toISOString(),
    };
  });
}

async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
