import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Pause, Brain, Hash, Clock, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { UnifiedSignal } from "@/hooks/useUnifiedSignals";

const VENUE_LABEL: Record<UnifiedSignal["venue"], string> = {
  polymarket: "Polymarket",
  hyperliquid: "Hyperliquid",
  onchain: "Onchain",
};

const VENUE_COLOR: Record<UnifiedSignal["venue"], string> = {
  polymarket: "text-purple-500 bg-purple-500/10",
  hyperliquid: "text-cyan-500 bg-cyan-500/10",
  onchain: "text-emerald-500 bg-emerald-500/10",
};

function fmtUsd(v: number | null | undefined): string {
  if (!v) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

export default function ReasoningTraceCard({ signal, onAct }: { signal: UnifiedSignal; onAct?: (s: UnifiedSignal) => void }) {
  const [expanded, setExpanded] = useState(false);

  const SideIcon =
    signal.side === "BUY" ? TrendingUp : signal.side === "SELL" ? TrendingDown : Pause;
  const sideColor =
    signal.side === "BUY" ? "text-emerald-500" : signal.side === "SELL" ? "text-red-500" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${VENUE_COLOR[signal.venue]}`}>
            {VENUE_LABEL[signal.venue]}
          </span>
          <span className={`flex items-center gap-1 text-xs font-semibold ${sideColor}`}>
            <SideIcon className="h-3.5 w-3.5" /> {signal.side}
          </span>
          {signal.is_stub && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
              STUB
            </span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {fmtTime(signal.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono text-foreground">{signal.confidence}%</span>
          <span className="text-[10px] text-muted-foreground">conf</span>
        </div>
      </div>

      {/* Market label + sizing */}
      <div className="mt-3">
        <p className="text-sm font-semibold text-foreground line-clamp-2">{signal.market_label ?? signal.market_id}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Size: <span className="text-foreground font-mono">{fmtUsd(signal.size_suggested_usdc)}</span></span>
          {signal.edge_estimate != null && (
            <span>Edge: <span className="text-foreground font-mono">{(signal.edge_estimate * 100).toFixed(1)}%</span></span>
          )}
          {signal.model && <span className="hidden sm:inline">Model: <span className="font-mono">{signal.model}</span></span>}
        </div>
      </div>

      {/* Source wallets */}
      {signal.source_wallets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signal.source_wallets.slice(0, 4).map((w) => (
            <span key={w} className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              {w.slice(0, 6)}...{w.slice(-4)}
            </span>
          ))}
        </div>
      )}

      {/* Trace toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Brain className="h-3.5 w-3.5" />
        {expanded ? "Hide reasoning" : "Show reasoning"}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{signal.reasoning_trace}</p>
              {(signal.trace_hash || signal.arc_tx_hash) && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {signal.trace_hash && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Trace hash:</span>
                      <code className="font-mono text-foreground truncate">{signal.trace_hash.slice(0, 16)}...</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(signal.trace_hash!); toast.success("Copied"); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {signal.arc_tx_hash && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Arc tx:</span>
                      <code className="font-mono text-foreground">{signal.arc_tx_hash.slice(0, 10)}...</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {onAct && signal.side !== "HOLD" && (
        <button
          onClick={() => onAct(signal)}
          className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Act on this signal →
        </button>
      )}
    </motion.div>
  );
}
