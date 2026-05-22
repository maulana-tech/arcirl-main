import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Activity, TrendingUp, Clock, Sparkles } from "lucide-react";
import { usePMMarket } from "@/hooks/usePolymarket";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import ReasoningTraceCard from "@/components/ReasoningTraceCard";
import BetConfirmModal from "@/components/BetConfirmModal";
import { BUILDER_ID } from "@/lib/polymarket";

function fmtUsd(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function MarketDetail() {
  const { marketId } = useParams<{ marketId: string }>();
  const navigate = useNavigate();
  const id = decodeURIComponent(marketId ?? "");
  const { market, loading, error } = usePMMarket(id);
  const { signals } = useUnifiedSignals({ venue: "polymarket", limit: 25 });
  const marketSignals = signals.filter((s) => s.market_id === id || s.market_id === market?.conditionId);
  const [bettingOutcome, setBettingOutcome] = useState<null | { id: string; label: string; price: number }>(null);
  const activeSignal = marketSignals[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/markets")}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg sm:text-xl font-bold text-foreground line-clamp-2">
            {market?.question ?? (loading ? "Loading…" : "Market not found")}
          </h1>
          {market?.slug && (
            <a
              href={`https://polymarket.com/event/${market.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[11px] text-primary hover:underline"
            >
              View on Polymarket <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">{error}</div>
      )}

      {market && (
        <>
          {/* Outcome cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {market.outcomes.map((o, i) => {
              const isYes = i === 0;
              const cents = (o.price * 100).toFixed(1);
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-5 ${isYes ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xs font-semibold ${isYes ? "text-emerald-500" : "text-red-500"}`}>
                      {o.label}
                    </span>
                    <span className={`font-mono text-2xl font-bold ${isYes ? "text-emerald-500" : "text-red-500"}`}>
                      {cents}¢
                    </span>
                  </div>
                  <button
                    onClick={() => setBettingOutcome({ id: o.id, label: o.label, price: o.price })}
                    className="mt-4 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Bet {o.label}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Market stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Activity className="h-3.5 w-3.5 text-cyan-500 mx-auto mb-1" />
              <p className="font-heading text-sm font-bold text-foreground">{fmtUsd(market.volume)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-1" />
              <p className="font-heading text-sm font-bold text-foreground">{fmtUsd(market.liquidity)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Liquidity</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Clock className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
              <p className="font-heading text-sm font-bold text-foreground">
                {market.endDate ? new Date(market.endDate).toLocaleDateString() : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolves</p>
            </div>
          </div>

          {/* Builder code disclosure */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bets placed through this app attach builder code{" "}
              <code className="font-mono text-foreground">{BUILDER_ID ?? "(unset)"}</code>. Builder fees are paid in USDC by the trader's counterparty and surface in the public earnings counter — no extra cost on top of the Polymarket spread.
            </p>
          </div>

          {bettingOutcome && (
            <BetConfirmModal
              open
              onClose={() => setBettingOutcome(null)}
              market={{
                id: market.id,
                question: market.question,
                outcomeId: bettingOutcome.id,
                outcomeLabel: bettingOutcome.label,
                price: bettingOutcome.price,
              }}
              signalId={activeSignal?.id}
              signalReasoning={activeSignal?.reasoning_trace}
            />
          )}

          {/* Agent signals on this market */}
          {marketSignals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm font-semibold text-foreground">Agent Signals</h2>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {marketSignals.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {marketSignals.map((s) => (
                  <ReasoningTraceCard key={s.id} signal={s} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
