import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Aggregates {
  totalBets: number;
  totalVolumeUsdc: number;
  totalFeesUsdc: number;
  recentBets: number;
}

const ZERO: Aggregates = { totalBets: 0, totalVolumeUsdc: 0, totalFeesUsdc: 0, recentBets: 0 };

export default function BuilderFeeWidget({ compact = false }: { compact?: boolean }) {
  const [aggs, setAggs] = useState<Aggregates>(ZERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Pull rows that hit the wire (placed or filled). Stub rows excluded
      // from public-facing earnings counter.
      const { data } = await supabase
        .from("bet_history")
        .select("size_usdc, builder_fee_usdc, created_at, status")
        .in("status", ["PLACED", "FILLED", "PARTIAL"]);

      if (cancelled) return;

      const rows = (data as any[]) ?? [];
      const cutoff = Date.now() - 24 * 3600_000;
      const next = rows.reduce<Aggregates>(
        (a, r) => ({
          totalBets: a.totalBets + 1,
          totalVolumeUsdc: a.totalVolumeUsdc + Number(r.size_usdc ?? 0),
          totalFeesUsdc: a.totalFeesUsdc + Number(r.builder_fee_usdc ?? 0),
          recentBets: a.recentBets + (new Date(r.created_at).getTime() >= cutoff ? 1 : 0),
        }),
        ZERO,
      );
      setAggs(next);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("bet-history-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "bet_history" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2"
      >
        <Coins className="h-4 w-4 text-emerald-500" />
        <div className="flex-1 flex items-center gap-4 text-xs">
          <span className="text-emerald-500 font-mono font-bold">${aggs.totalFeesUsdc.toFixed(2)}</span>
          <span className="text-muted-foreground">in builder fees · {aggs.totalBets} bets</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Coins className="h-4 w-4 text-emerald-500" />
        <h3 className="font-heading text-sm font-semibold text-foreground">Builder Fees Earned</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">live</span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total fees" value={`$${aggs.totalFeesUsdc.toFixed(2)}`} accent="emerald" />
          <Stat label="Volume" value={`$${aggs.totalVolumeUsdc.toFixed(0)}`} accent="cyan" />
          <Stat label="Bets · 24h" value={`${aggs.recentBets}`} accent="amber" sub={<><TrendingUp className="h-3 w-3 inline" /> of {aggs.totalBets} total</>} />
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        Every bet placed via this app attaches a builder code; fees are paid by the counterparty out of the spread. No extra cost to bettors.
      </p>
    </motion.div>
  );
}

function Stat({
  label, value, accent, sub,
}: {
  label: string; value: string;
  accent: "emerald" | "cyan" | "amber";
  sub?: React.ReactNode;
}) {
  const color =
    accent === "emerald" ? "text-emerald-500" : accent === "cyan" ? "text-cyan-500" : "text-amber-500";
  return (
    <div className="rounded-lg bg-secondary/50 p-2 text-center">
      <p className={`font-heading text-base sm:text-lg font-bold ${color} font-mono`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
