import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, Bell, Search, Shield, RefreshCw, Sparkles } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ReasoningTraceCard from "@/components/ReasoningTraceCard";
import BuilderFeeWidget from "@/components/BuilderFeeWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUnifiedSignals, triggerSignalEngine, UnifiedSignal } from "@/hooks/useUnifiedSignals";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats } = useDashboardStats();
  const { signals, loading, refetch } = useUnifiedSignals({ limit: 25 });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await triggerSignalEngine({ maxSignals: 3 });
      toast.success(r.isStub ? `Inserted ${r.inserted} stub signals` : `Inserted ${r.inserted} live signals`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Signal engine failed");
    } finally {
      setRefreshing(false);
    }
  };

  const onActOnSignal = (s: UnifiedSignal) => {
    if (s.venue === "polymarket") navigate(`/markets/${encodeURIComponent(s.market_id)}`);
    else if (s.venue === "hyperliquid") navigate(`/perps`);
    else navigate(`/smart-money`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Signal Feed</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Autonomous cross-venue signals · Smart Money Copy Agent
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Generating..." : "Trigger engine"}
        </button>
      </div>

      <BuilderFeeWidget />

      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        <div className="cursor-pointer" onClick={() => navigate("/smart-money")}>
          <StatCard icon={Wallet} label="Tracked Wallets" value={stats.totalTrackedWallets.toLocaleString()} change="Live" changeType="positive" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/alerts")}>
          <StatCard icon={Bell} label="Active Alerts" value={stats.activeAlerts.toString()} change="—" changeType="neutral" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/smart-money")}>
          <StatCard icon={Search} label="Signals (24h)" value={signals.length.toString()} change="Live" changeType="positive" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/alerts?filter=risk")}>
          <StatCard icon={Shield} label="Risk Events" value={stats.riskEventsToday.toString()} change="—" changeType="neutral" />
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-sm font-semibold text-foreground">Latest Signals</h2>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {loading ? "loading..." : `${signals.length} signals`}
        </span>
      </div>

      {loading && signals.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading signal feed…</p>
        </div>
      )}

      {!loading && signals.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">No signals yet</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            The signal engine hasn't run yet, or no tracked wallets are producing actionable moves.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Trigger engine now
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {signals.map((s) => (
          <ReasoningTraceCard key={s.id} signal={s} onAct={onActOnSignal} />
        ))}
      </div>
    </div>
  );
}
