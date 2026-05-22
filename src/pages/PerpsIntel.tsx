import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { useTopHLTraders, HLPosition } from "@/hooks/usePerpsIntel";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";

function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function fmtSize(coin: string, size: number): string {
  if (Math.abs(size) >= 1) return `${size.toFixed(2)} ${coin}`;
  return `${size.toFixed(4)} ${coin}`;
}

export default function PerpsIntel() {
  const navigate = useNavigate();
  const { traders, loading, error, refetch } = useTopHLTraders(15);
  const { signals } = useUnifiedSignals({ venue: "hyperliquid", limit: 25 });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Perps Intel</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Hyperliquid whale positions · leading indicators for prediction-market bets
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
          {error}
        </div>
      )}

      {signals.length > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="flex items-center gap-1.5 text-xs text-emerald-500">
            <Zap className="h-3.5 w-3.5" />
            {signals.length} active HL-derived signal{signals.length > 1 ? "s" : ""} — the engine is watching these whales right now.
          </p>
        </div>
      )}

      {loading && traders.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Pulling whale positions…</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {traders.map((t) => (
          <motion.div
            key={t.address}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <button
                onClick={() => navigate(`/smart-money/${encodeURIComponent(t.address)}?venue=hyperliquid`)}
                className="text-left min-w-0"
              >
                <p className="font-mono text-xs text-foreground hover:text-primary">
                  {t.address.slice(0, 10)}...{t.address.slice(-6)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Account: <span className="text-foreground font-mono">{fmtUsd(t.accountValue)}</span>
                </p>
              </button>
              {t.positions.length > 0 && (
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-500">
                  {t.positions.length} pos
                </span>
              )}
            </div>

            {t.positions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No open positions.</p>
            ) : (
              <div className="space-y-1.5">
                {t.positions.slice(0, 5).map((p) => (
                  <PositionRow key={p.coin + p.entryPx} pos={p} />
                ))}
                {t.positions.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    +{t.positions.length - 5} more positions
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PositionRow({ pos }: { pos: HLPosition }) {
  const isLong = pos.size > 0;
  const Icon = isLong ? ArrowUpRight : ArrowDownRight;
  const sideColor = isLong ? "text-emerald-500" : "text-red-500";
  const pnlColor = pos.unrealizedPnl >= 0 ? "text-emerald-500" : "text-red-500";

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-3.5 w-3.5 ${sideColor}`} />
        <span className="text-xs font-mono font-semibold text-foreground">{pos.coin}</span>
        <span className="text-[10px] text-muted-foreground">{fmtSize(pos.coin, pos.size)}</span>
        {pos.leverage > 0 && (
          <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 font-mono">
            {pos.leverage}x
          </span>
        )}
      </div>
      <div className="text-right text-[10px] shrink-0 ml-2">
        <span className={`font-mono font-bold ${pnlColor}`}>{fmtUsd(pos.unrealizedPnl)}</span>
        <span className="ml-1 text-muted-foreground">@{pos.entryPx.toFixed(2)}</span>
      </div>
    </div>
  );
}
