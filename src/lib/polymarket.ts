// Polymarket CLOB client — every order carries our builder code so we earn
// USDC fees on each fill. Builder codes are the monetization spine for the
// Smart Money Copy Agent.
//
// Docs: https://docs.polymarket.com/trading/clients/builder

const CLOB_BASE = "https://clob.polymarket.com";
const GAMMA_BASE = "https://gamma-api.polymarket.com";

// Builder ID with fallback for demo deployment (should be set via VITE_POLYMARKET_BUILDER_ID env var)
export const BUILDER_ID = (import.meta.env.VITE_POLYMARKET_BUILDER_ID as string | undefined)
  || "0x7f178d13441d900ff266b7c9fe9a2d3fbf5c15f99ee433e8ef1adb00d308d937";

export interface PMMarket {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  volume: number;
  liquidity: number;
  outcomes: { id: string; label: string; price: number }[];
  active: boolean;
}

export interface PMOrderbookLevel {
  price: number;
  size: number;
}

export interface PMOrderbook {
  marketId: string;
  outcomeId: string;
  bids: PMOrderbookLevel[];
  asks: PMOrderbookLevel[];
}

export interface PMOrderRequest {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  walletAddress: `0x${string}`;
}

export interface PMOrderResult {
  orderId: string;
  txHash?: `0x${string}`;
  status: "PLACED" | "FILLED" | "PARTIAL" | "REJECTED";
  builderFeeUsdc?: string;
}

export interface PMTrader {
  address: `0x${string}`;
  pnlUsdc: number;
  volumeUsdc: number;
  winRate: number;
  trades30d: number;
}

// ─── Read endpoints (public, no auth) ───────────────────────────────────────

export async function getActiveMarkets(opts?: {
  limit?: number;
  category?: string;
}): Promise<PMMarket[]> {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: String(opts?.limit ?? 50),
  });
  if (opts?.category) params.set("category", opts.category);

  const res = await fetch(`${GAMMA_BASE}/markets?${params}`);
  if (!res.ok) throw new Error(`Polymarket markets fetch failed: ${res.status}`);
  const data = await res.json();

  return (data as any[]).map((m) => ({
    id: m.id ?? m.condition_id,
    question: m.question,
    slug: m.slug,
    endDate: m.end_date_iso ?? m.endDate,
    volume: Number(m.volume ?? 0),
    liquidity: Number(m.liquidity ?? 0),
    outcomes: (m.outcomes ?? []).map((o: any) => ({
      id: o.token_id ?? o.id,
      label: o.outcome ?? o.label,
      price: Number(o.price ?? 0),
    })),
    active: Boolean(m.active),
  }));
}

export async function getOrderbook(marketId: string, outcomeId: string): Promise<PMOrderbook> {
  const res = await fetch(`${CLOB_BASE}/book?token_id=${outcomeId}`);
  if (!res.ok) throw new Error(`Polymarket orderbook fetch failed: ${res.status}`);
  const data = await res.json();

  return {
    marketId,
    outcomeId,
    bids: (data.bids ?? []).map((b: any) => ({ price: Number(b.price), size: Number(b.size) })),
    asks: (data.asks ?? []).map((a: any) => ({ price: Number(a.price), size: Number(a.size) })),
  };
}

// ─── Write endpoints (require signed order + builder code) ──────────────────

export async function placeOrder(req: PMOrderRequest): Promise<PMOrderResult> {
  if (!BUILDER_ID) {
    throw new Error("VITE_POLYMARKET_BUILDER_ID not configured");
  }
  // TODO: sign order with embedded Circle wallet, POST to /order with
  //   builder_address = BUILDER_ID. Persist orderId so we can reconcile fills
  //   against bet_history table.
  throw new Error("placeOrder: not implemented — pending builder ID + Circle wallet signing");
}

// ─── Trader analytics (for RFB 06 smart wallet tracker) ─────────────────────

export async function getTopTraders(opts?: {
  window?: "7d" | "30d" | "all";
  limit?: number;
}): Promise<PMTrader[]> {
  // TODO: real leaderboard endpoint. Polymarket has a /leaderboard route that
  //   varies — confirm exact shape during Phase 1 integration.
  return [];
}
