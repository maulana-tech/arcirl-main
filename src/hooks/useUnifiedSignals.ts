import { useEffect, useState, useCallback } from "react";
import { supabase, fnFetch, SUPABASE_URL } from "@/integrations/supabase/client";

export type SignalVenue = "hyperliquid" | "polymarket" | "onchain";
export type SignalSide = "BUY" | "SELL" | "HOLD";

export interface UnifiedSignal {
  id: string;
  created_at: string;
  expires_at: string | null;
  venue: SignalVenue;
  market_id: string;
  market_label: string | null;
  side: SignalSide;
  size_suggested_usdc: number | null;
  edge_estimate: number | null;
  confidence: number;
  reasoning_trace: string;
  trace_hash: string | null;
  arc_tx_hash: string | null;
  source_wallets: string[];
  model: string | null;
  is_stub: boolean;
}

export function useUnifiedSignals(opts?: { venue?: SignalVenue; limit?: number }) {
  const [signals, setSignals] = useState<UnifiedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 50);
    if (opts?.venue) q = q.eq("venue", opts.venue);
    const { data } = await q;
    setSignals((data as UnifiedSignal[]) ?? []);
    setLoading(false);
  }, [opts?.venue, opts?.limit]);

  useEffect(() => {
    fetchSignals();
    const channel = supabase
      .channel("signals-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        (payload) => {
          const next = payload.new as UnifiedSignal;
          if (opts?.venue && next.venue !== opts.venue) return;
          setSignals((prev) => [next, ...prev].slice(0, opts?.limit ?? 50));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals, opts?.venue, opts?.limit]);

  return { signals, loading, refetch: fetchSignals };
}

// Trigger an out-of-band signal-engine run (e.g. for a "Refresh signals" button).
export async function triggerSignalEngine(opts?: { maxSignals?: number; sourceWallets?: string[] }) {
  const res = await fnFetch(`${SUPABASE_URL}/functions/v1/signal-engine`, {
    method: "POST",
    body: JSON.stringify(opts ?? {}),
  });
  if (!res.ok) throw new Error(`signal-engine [${res.status}]`);
  return res.json();
}
