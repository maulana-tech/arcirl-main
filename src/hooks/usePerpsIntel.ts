import { useEffect, useState, useCallback } from "react";
import { fnFetch, SUPABASE_URL } from "@/integrations/supabase/client";

const HL_FN = `${SUPABASE_URL}/functions/v1/hyperliquid-fetch`;

export interface HLPosition {
  coin: string;
  size: number;
  entryPx: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPx: number;
}

export interface HLTraderDetail {
  address: `0x${string}`;
  accountValue: number;
  pnl: number;
  positions: HLPosition[];
}

export function useTopHLTraders(limit = 15) {
  const [traders, setTraders] = useState<HLTraderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fnFetch(`${HL_FN}?action=leaderboard&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const seedTraders = data.traders ?? [];

      const enriched = await Promise.all(
        seedTraders.map(async (t: any) => {
          try {
            const r = await fnFetch(`${HL_FN}?action=positions&address=${t.address}`);
            if (!r.ok) return { ...t, positions: [] };
            const pd = await r.json();
            return { ...t, positions: pd.positions ?? [] };
          } catch {
            return { ...t, positions: [] };
          }
        }),
      );
      setTraders(enriched);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load HL traders");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { traders, loading, error, refetch };
}
