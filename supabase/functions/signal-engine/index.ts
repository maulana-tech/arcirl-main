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

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-7";

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
    if (ANTHROPIC_KEY) {
      signals = await callClaude(context, maxSignals);
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

    return json({ inserted: enriched.length, isStub: !ANTHROPIC_KEY });
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});

async function gatherContext(supabase: any, sourceWallets: string[]) {
  const wallets = sourceWallets.length > 0
    ? sourceWallets
    : (await supabase.from("tracked_wallets").select("address, venue, label").limit(50)).data ?? [];

  // Fetch PM markets for context (free public endpoint, cheap call).
  let markets: any[] = [];
  try {
    const res = await fetch("https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=20&order=volume&ascending=false");
    if (res.ok) markets = await res.json();
  } catch { /* swallow */ }

  return { wallets, markets: markets.slice(0, 20) };
}

async function callClaude(context: any, maxSignals: number): Promise<SignalRow[]> {
  const systemPrompt = `You are the Smart Money Copy Agent — an autonomous trading analyst for prediction markets (Polymarket), perpetual futures (Hyperliquid), and onchain swaps (Arc). You watch smart-money wallets and propose +EV trades when their moves align with market mispricing.

Output strict JSON only, no prose. Schema:
{
  "signals": [
    {
      "venue": "polymarket" | "hyperliquid" | "onchain",
      "market_id": string,
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
${JSON.stringify(context.markets.map((m: any) => ({ id: m.id, q: m.question, vol: m.volume, end: m.end_date_iso })), null, 2)}

Produce up to ${maxSignals} actionable signals.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";

  let parsed: { signals?: any[] } = {};
  try { parsed = JSON.parse(text); } catch { parsed = {}; }
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

function stubSignals(context: any, maxSignals: number): SignalRow[] {
  // Deterministic stub: pick top-volume Polymarket markets and emit
  // illustrative signals so the UI has content while ANTHROPIC_API_KEY is
  // not provisioned. Clearly flagged with is_stub=true.
  const picks = context.markets.slice(0, maxSignals);
  const wallets = context.wallets.slice(0, 3).map((w: any) => w.address ?? w);

  return picks.map((m: any, i: number) => {
    const sides: SignalRow["side"][] = ["BUY", "SELL", "HOLD"];
    const side = sides[i % 3];
    return {
      venue: "polymarket",
      market_id: String(m.id ?? m.condition_id ?? `stub-${i}`),
      market_label: m.question ?? `Stub market #${i + 1}`,
      side,
      size_suggested_usdc: 25,
      edge_estimate: 0.05 + i * 0.02,
      confidence: 55 + i * 5,
      reasoning_trace: `STUB SIGNAL — LLM key not configured. Selected by 24h volume rank (#${i + 1}, $${Number(m.volume ?? 0).toLocaleString()}). Source wallets sampled: ${wallets.join(", ") || "none tracked yet"}. Replace with real Anthropic-backed reasoning once ANTHROPIC_API_KEY is set.`,
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
