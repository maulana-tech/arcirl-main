// Polymarket trader analytics.
// Pulls active markets and top traders. Public Gamma + CLOB endpoints.
//
// Actions:
//   ?action=markets     → active markets (limit, category)
//   ?action=top-traders → leaderboard (limit, window)
//   ?action=user        → activity for ?address=

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GAMMA = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE = new Map<string, { data: unknown; ts: number }>();
function cached(key: string, ttl: number) {
  const c = CACHE.get(key);
  if (c && Date.now() - c.ts < ttl) return c.data;
  return null;
}
function setCache(key: string, data: unknown) {
  CACHE.set(key, { data, ts: Date.now() });
}

async function get(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Polymarket [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "markets";

    if (action === "markets") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
      const category = url.searchParams.get("category");
      const ck = `pm-markets-${limit}-${category ?? "all"}`;
      const c = cached(ck, 30_000);
      if (c) return json(c);

      const params = new URLSearchParams({
        active: "true",
        closed: "false",
        limit: String(limit),
        order: "volume",
        ascending: "false",
      });
      if (category) params.set("category", category);
      const data = await get(`${GAMMA}/markets?${params}`);

      const markets = (Array.isArray(data) ? data : []).map((m: any) => ({
        id: m.condition_id ?? m.id,  // Use condition_id as canonical ID
        conditionId: m.condition_id ?? m.id,
        question: m.question,
        slug: m.slug,
        endDate: m.end_date_iso ?? m.endDate,
        volume: Number(m.volume ?? 0),
        liquidity: Number(m.liquidity ?? 0),
        outcomes: (() => {
          try {
            const outcomes = typeof m.outcomes === "string" ? JSON.parse(m.outcomes) : m.outcomes ?? [];
            const prices = typeof m.outcomePrices === "string" ? JSON.parse(m.outcomePrices) : m.outcomePrices ?? [];
            const tokens = typeof m.clobTokenIds === "string" ? JSON.parse(m.clobTokenIds) : m.clobTokenIds ?? [];
            return outcomes.map((label: string, i: number) => ({
              id: tokens[i] ?? String(i),
              label,
              price: Number(prices[i] ?? 0),
            }));
          } catch {
            return [];
          }
        })(),
        category: m.category,
        active: Boolean(m.active),
      }));

      const result = { markets };
      setCache(ck, result);
      return json(result);
    }

    if (action === "top-traders") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100);
      const window = url.searchParams.get("window") || "all";
      const ck = `pm-leaders-${limit}-${window}`;
      const c = cached(ck, 60_000);
      if (c) return json(c);

      // Polymarket exposes leaderboards at data-api.polymarket.com/leaderboard.
      // Shape varies; we normalize defensively.
      let raw: any[] = [];
      try {
        raw = await get(`${DATA_API}/leaderboard?window=${window}&limit=${limit}`);
        if (!Array.isArray(raw)) raw = [];
      } catch {
        raw = [];
      }

      const traders = raw.slice(0, limit).map((t: any) => ({
        address: (t.proxyWallet ?? t.address ?? "").toLowerCase(),
        username: t.username ?? t.name ?? null,
        pnlUsdc: Number(t.profit ?? t.pnl ?? 0),
        volumeUsdc: Number(t.volume ?? 0),
        positions: Number(t.positions ?? t.trades ?? 0),
      })).filter((t) => t.address);

      const result = { traders, window };
      setCache(ck, result);
      return json(result);
    }

    if (action === "user") {
      const address = (url.searchParams.get("address") || "").toLowerCase();
      if (!address) return json({ error: "address parameter required" }, 400);

      const ck = `pm-user-${address}`;
      const c = cached(ck, 30_000);
      if (c) return json(c);

      let activity: any[] = [];
      let positions: any[] = [];
      try {
        activity = await get(`${DATA_API}/activity?user=${address}&limit=50`);
      } catch { /* swallow */ }
      try {
        positions = await get(`${DATA_API}/positions?user=${address}`);
      } catch { /* swallow */ }

      const result = {
        address,
        activity: Array.isArray(activity) ? activity : [],
        positions: Array.isArray(positions) ? positions : [],
      };
      setCache(ck, result);
      return json(result);
    }

    return json({ error: "Unknown action. Use: markets, top-traders, user" }, 400);
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
