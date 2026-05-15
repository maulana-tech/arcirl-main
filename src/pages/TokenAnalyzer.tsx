import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, RefreshCw, Sparkles, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Users, Coins, ExternalLink, Brain,
} from "lucide-react";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useSmartWallets } from "@/hooks/useSmartWallets";
import ReasoningTraceCard from "@/components/ReasoningTraceCard";

const PRESETS = ["BTC", "ETH", "SOL", "DOGE", "PEPE", "WLD", "AAVE", "LINK"];

function fmtUsd(v: number): string {
  if (!v) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  if (abs < 1) return `$${abs.toFixed(6)}`;
  return `$${abs.toFixed(2)}`;
}

function riskBucket(score: number): { label: string; color: string } {
  if (score < 30) return { label: "Low risk", color: "emerald" };
  if (score < 60) return { label: "Moderate risk", color: "amber" };
  return { label: "High risk", color: "red" };
}

export default function TokenAnalyzer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("token") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [committed, setCommitted] = useState(initialQuery);

  const { data, loading, error, refetch } = useTokenInfo(committed || undefined);
  const { signals } = useUnifiedSignals({ limit: 50 });
  const { wallets: onchainWallets } = useSmartWallets("onchain");

  const tokenSignals = useMemo(() => {
    if (!data) return [];
    const sym = (data.symbol ?? "").toUpperCase();
    const addr = (data.address ?? "").toLowerCase();
    return signals.filter((s) => {
      const mid = (s.market_id ?? "").toLowerCase();
      const mlabel = (s.market_label ?? "").toUpperCase();
      return mid === addr || mid.includes(sym.toLowerCase()) || mlabel.includes(sym);
    });
  }, [data, signals]);

  const holdingWallets = useMemo(() => {
    // Naive heuristic: if any signal source_wallets overlap tracked onchain
    // wallets, surface them as "holders we track". Real holder lookup would
    // need a per-token Moralis call (defer to Phase 5+ if needed).
    if (!data) return [];
    const sigAddrs = new Set(tokenSignals.flatMap((s) => s.source_wallets.map((a) => a.toLowerCase())));
    return onchainWallets.filter((w) => sigAddrs.has(w.address.toLowerCase()));
  }, [data, tokenSignals, onchainWallets]);

  const commit = (q: string) => {
    setQuery(q);
    setCommitted(q);
    if (q) setSearchParams({ token: q });
    else setSearchParams({});
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Token Analyzer</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Per-token risk + agent signals + smart-money exposure
        </p>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(query)}
              placeholder="Symbol (BTC, ETH...) or contract address"
              className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary font-mono"
            />
          </div>
          <button
            onClick={() => commit(query)}
            disabled={!query.trim() || loading}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground self-center">Quick:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => commit(p)}
              className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">{error}</div>
      )}

      {!committed && !loading && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">Enter a token to analyze</p>
          <p className="mt-1 text-xs text-muted-foreground">Symbols hit AVE/CMC search; addresses query the chain directly</p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Analyzing {committed}…</p>
        </div>
      )}

      {data && (
        <>
          {/* Token header */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-start gap-3 flex-wrap">
              {data.logoUrl && (
                <img src={data.logoUrl} alt={data.symbol} className="h-12 w-12 rounded-lg object-contain bg-secondary" />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-lg font-bold text-foreground">{data.name}</h2>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">{data.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">{data.chain}</span>
                  {data.address && (
                    <a
                      href={`https://etherscan.io/address/${data.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-mono"
                    >
                      {data.address.slice(0, 8)}...{data.address.slice(-4)} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-xl sm:text-2xl font-bold text-foreground font-mono">{fmtUsd(data.price)}</p>
                <p className={`text-xs font-mono ${data.priceChange24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {data.priceChange24h >= 0 ? "+" : ""}{data.priceChange24h.toFixed(2)}% 24h
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Stat icon={Coins} label="Market Cap" value={fmtUsd(data.marketCap)} accent="cyan" />
            <Stat icon={Activity} label="24h Volume" value={fmtUsd(data.volume24h)} accent="emerald" />
            <Stat icon={Users} label="Holders" value={data.holders ? data.holders.toLocaleString() : "—"} accent="purple" />
            <Stat icon={TrendingUp} label="Liquidity" value={fmtUsd(data.liquidity)} accent="amber" />
          </div>

          {/* Risk panel */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">Risk Assessment</h3>
            </div>
            <RiskMeter score={data.riskScore} />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RiskFlag label="Liquidity locked" ok={data.liquidityLocked} />
              <RiskFlag label="Not mintable" ok={!data.isMintable} />
              <RiskFlag label="Not honeypot" ok={!data.isHoneypot} />
              <RiskFlag label="No blacklist method" ok={!data.hasBlackMethod} />
            </div>
            {(data.isHoneypot || data.hasBlackMethod) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-500">High-severity flags detected. Smart money typically avoids tokens with honeypot or blacklist mechanics.</p>
              </div>
            )}
          </div>

          {/* Agent signals on this token */}
          {tokenSignals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold text-foreground">Agent Signals on {data.symbol}</h3>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{tokenSignals.length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {tokenSignals.slice(0, 4).map((s) => (
                  <ReasoningTraceCard key={s.id} signal={s} />
                ))}
              </div>
            </div>
          )}

          {/* Smart wallets exposure */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <h3 className="font-heading text-sm font-semibold text-foreground">Smart-Money Exposure</h3>
              </div>
              <button
                onClick={() => navigate("/smart-money")}
                className="text-[11px] text-primary hover:underline"
              >
                Track more wallets →
              </button>
            </div>
            {holdingWallets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tracked onchain wallets currently flagged as moving this token by the agent. Add wallets in <button onClick={() => navigate("/smart-money")} className="text-primary hover:underline">Smart Money</button> to surface exposure here.
              </p>
            ) : (
              <div className="space-y-1.5">
                {holdingWallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/smart-money/${encodeURIComponent(w.address)}?venue=onchain&chain=${(w.chain ?? "eth").toLowerCase()}`)}
                    className="w-full flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-2.5 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{w.label || "Unnamed"}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{w.address.slice(0, 8)}...{w.address.slice(-4)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-500 shrink-0">flagged by agent</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, accent,
}: {
  icon: any; label: string; value: string;
  accent: "cyan" | "emerald" | "purple" | "amber";
}) {
  const color =
    accent === "cyan" ? "text-cyan-500" :
    accent === "emerald" ? "text-emerald-500" :
    accent === "purple" ? "text-purple-500" :
    "text-amber-500";
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <Icon className={`h-3.5 w-3.5 ${color} mx-auto mb-1`} />
      <p className="font-heading text-sm font-bold text-foreground font-mono">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function RiskMeter({ score }: { score: number }) {
  const bucket = riskBucket(score);
  const color =
    bucket.color === "emerald" ? "bg-emerald-500" :
    bucket.color === "amber" ? "bg-amber-500" :
    "bg-red-500";
  const textColor =
    bucket.color === "emerald" ? "text-emerald-500" :
    bucket.color === "amber" ? "text-amber-500" :
    "text-red-500";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-xs font-semibold ${textColor}`}>{bucket.label}</span>
        <span className="font-mono text-lg font-bold text-foreground">{score}<span className="text-xs text-muted-foreground">/100</span></span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
}

function RiskFlag({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
      ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
    }`}>
      <span className="text-[11px] text-foreground">{label}</span>
      <span className={`text-[10px] font-semibold ${ok ? "text-emerald-500" : "text-red-500"}`}>{ok ? "✓" : "✗"}</span>
    </div>
  );
}
