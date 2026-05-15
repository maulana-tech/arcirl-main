import { useEffect, useState, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PM_FN = `${SUPABASE_URL}/functions/v1/polymarket-traders`;

export interface PMMarketRow {
  id: string;
  conditionId: string;
  question: string;
  slug: string;
  endDate: string;
  volume: number;
  liquidity: number;
  outcomes: { id: string; label: string; price: number }[];
  category: string | null;
  active: boolean;
}

export function usePMMarkets(opts?: { limit?: number; category?: string }) {
  const [markets, setMarkets] = useState<PMMarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: "markets",
        limit: String(opts?.limit ?? 50),
      });
      if (opts?.category) params.set("category", opts.category);
      const res = await fetch(`${PM_FN}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  }, [opts?.limit, opts?.category]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return { markets, loading, error, refetch: fetchMarkets };
}

// Single-market fetcher (uses Gamma directly via the edge fn list and filters).
// Cheaper than wiring a new edge action; OK for one-off lookups.
export function usePMMarket(marketId: string | undefined) {
  const { markets, loading, error, refetch } = usePMMarkets({ limit: 200 });
  const market = marketId
    ? markets.find((m) => m.id === marketId || m.conditionId === marketId)
    : undefined;
  return { market, loading, error, refetch };
}
