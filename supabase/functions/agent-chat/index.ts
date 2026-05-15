// Agent chat — conversational interface to the Smart Money Copy Agent.
//
// Anthropic-backed. Injects live context (recent signals + tracked wallets +
// recent bets) so the agent can reason over the user's actual state, not just
// a hypothetical.
//
// Falls back to a deterministic stub response when ANTHROPIC_API_KEY is unset
// so the chat surface stays demoable.
//
// POST body:
//   { messages: [{ role: "user"|"assistant", content: string }, ...] }

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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) return json({ error: "messages required" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const context = await gatherContext(supabase);

    if (!ANTHROPIC_KEY) {
      return json({ reply: stubReply(messages, context), isStub: true });
    }

    const reply = await callClaude(messages, context);
    return json({ reply, isStub: false });
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});

async function gatherContext(supabase: any) {
  const [signalsRes, walletsRes, betsRes] = await Promise.all([
    supabase.from("signals").select("*").order("created_at", { ascending: false }).limit(15),
    supabase.from("tracked_wallets").select("address, venue, label").limit(40),
    supabase.from("bet_history").select("market_question, side, size_usdc, status, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  return {
    signals: signalsRes.data ?? [],
    wallets: walletsRes.data ?? [],
    bets: betsRes.data ?? [],
  };
}

async function callClaude(messages: ChatMessage[], context: any): Promise<string> {
  const systemPrompt = `You are the Smart Money Copy Agent's conversational interface — talking to a user about the autonomous trading signals you generate.

You have live context:

Recent signals (newest first):
${JSON.stringify(context.signals.slice(0, 10).map((s: any) => ({
  id: s.id,
  venue: s.venue,
  side: s.side,
  market: s.market_label,
  confidence: s.confidence,
  edge: s.edge_estimate,
  is_stub: s.is_stub,
  trace: (s.reasoning_trace ?? "").slice(0, 400),
})), null, 2)}

Tracked smart wallets:
${JSON.stringify(context.wallets, null, 2)}

User's recent bets:
${JSON.stringify(context.bets, null, 2)}

Be direct. If asked "why did you flag X?", quote the actual reasoning_trace from a real signal. If asked "what's whale Y doing?", reference their venue + recent activity. If the user asks something you don't have context for, say so plainly — don't invent. Keep replies under 200 words unless asked for depth.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "(empty response)";
}

function stubReply(messages: ChatMessage[], context: any): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? "";

  if (last.includes("signal") || last.includes("flag")) {
    const top = context.signals[0];
    if (!top) return "No signals in the feed yet — the engine hasn't produced any output for tracked wallets. Hit 'Trigger engine' on the Feed page or check back after the next 5-min cron tick.";
    return `STUB MODE. Top signal right now: ${top.side} on ${top.venue} market "${top.market_label ?? top.market_id}" at ${top.confidence}% confidence. The reasoning trace says: "${(top.reasoning_trace ?? "").slice(0, 300)}..." (Set ANTHROPIC_API_KEY to get free-form reasoning here.)`;
  }

  if (last.includes("whale") || last.includes("wallet")) {
    const hl = context.wallets.filter((w: any) => w.venue === "hyperliquid");
    const pm = context.wallets.filter((w: any) => w.venue === "polymarket");
    return `STUB MODE. Tracking ${hl.length} Hyperliquid whales, ${pm.length} Polymarket traders, and ${context.wallets.length - hl.length - pm.length} onchain wallets. Open /perps to see live HL positions, /smart-money for the full venue-tabbed tracker. Set ANTHROPIC_API_KEY for per-wallet reasoning.`;
  }

  if (last.includes("bet") || last.includes("trade") || last.includes("buy") || last.includes("sell")) {
    const realBets = context.bets.filter((b: any) => b.status !== "STUB");
    return `STUB MODE. You have ${context.bets.length} bets in history (${realBets.length} live, rest stubbed). Bets attach builder code automatically — earnings counter is on the Feed page. Configure VITE_POLYMARKET_BUILDER_ID + VITE_CIRCLE_APP_ID to switch from stub to live mode.`;
  }

  return `STUB MODE. The chat is wired and the database is connected, but Claude reasoning isn't active until ANTHROPIC_API_KEY is set in Supabase secrets. You can ask about: signals, whales/wallets, bets/trades. Live mode unlocks free-form Q&A with full context.`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
