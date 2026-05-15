import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDownUp, Search, TrendingUp, TrendingDown, Coins, AlertTriangle, Sparkles, ExternalLink, Brain,
} from "lucide-react";
import { toast } from "sonner";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import ReasoningTraceCard from "@/components/ReasoningTraceCard";
import { CIRCLE_APP_ID } from "@/lib/circle";

const PRESETS = ["BTC", "ETH", "SOL", "ARB", "PEPE", "WLD", "AAVE", "LINK"];

function fmtUsd(v: number): string {
  if (!v) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  if (abs < 1) return `$${abs.toFixed(6)}`;
  return `$${abs.toFixed(2)}`;
}

export default function Trading() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialToken = searchParams.get("token") ?? "ETH";
  const [query, setQuery] = useState(initialToken);
  const [committed, setCommitted] = useState(initialToken);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState<string>("100");
  const [pending, setPending] = useState(false);

  const { data: token, loading, error } = useTokenInfo(committed || undefined);
  const { signals } = useUnifiedSignals({ limit: 100 });

  const tokenSignals = useMemo(() => {
    if (!token) return [];
    const sym = (token.symbol ?? "").toUpperCase();
    const addr = (token.address ?? "").toLowerCase();
    return signals.filter((s) => {
      const mid = (s.market_id ?? "").toLowerCase();
      const mlabel = (s.market_label ?? "").toUpperCase();
      return mid === addr || mlabel.includes(sym);
    });
  }, [token, signals]);

  const commit = (q: string) => {
    setQuery(q);
    setCommitted(q);
    setSearchParams({ token: q });
  };

  const amountNum = Number(amount) || 0;
  const tokenAmount = token && token.price > 0 ? amountNum / token.price : 0;
  const stubMode = !CIRCLE_APP_ID;

  const handleSwap = async () => {
    if (amountNum <= 0) {
      toast.error("Enter a USDC amount");
      return;
    }
    if (!token) {
      toast.error("Select a token first");
      return;
    }
    setPending(true);
    try {
      if (stubMode) {
        await new Promise((r) => setTimeout(r, 600));
        toast.message("Recorded as stub", {
          description: "VITE_CIRCLE_APP_ID not set — no on-chain swap will be placed. Configure Circle Wallets to enable live execution.",
        });
      } else {
        // TODO: integrate quoteSwap + executeSwap from src/lib/circle.ts once
        //       Arc DEX router address is provisioned. For now show success
        //       message; replace this branch with real flow when ready.
        toast.success(`${side} ${token.symbol} simulated · ${amountNum} USDC`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Swap failed");
    } finally {
      setPending(false);
    }
  };

  const aiBuy = tokenSignals.find((s) => s.side === "BUY");
  const aiSell = tokenSignals.find((s) => s.side === "SELL");
  const aiSuggestion = aiBuy ?? aiSell;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Trading</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Whale-driven spot · execute on agent signals via Circle Wallet on Arc
        </p>
      </div>

      {/* Token picker */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(query)}
              placeholder="Symbol or contract address"
              className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary font-mono"
            />
          </div>
          <button
            onClick={() => commit(query)}
            disabled={!query.trim() || loading}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Load
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground self-center">Quick:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => commit(p)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                committed === p
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">{error}</div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-secondary/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">Loading token…</p>
        </div>
      )}

      {token && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Swap panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Token header */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {token.logoUrl && <img src={token.logoUrl} alt={token.symbol} className="h-10 w-10 rounded-lg bg-secondary object-contain" />}
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">{token.symbol}</h2>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-foreground">{fmtUsd(token.price)}</p>
                  <p className={`text-xs font-mono ${token.priceChange24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}% 24h
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Buy/Sell tabs */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1 mb-4">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                      side === s
                        ? s === "BUY"
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s} {token.symbol}
                  </button>
                ))}
              </div>

              {/* USDC input */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{side === "BUY" ? "Pay" : "Receive"} (USDC)</label>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl font-mono font-bold text-foreground outline-none"
                    />
                    <span className="font-mono text-sm text-muted-foreground">USDC</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[50, 100, 250, 1000].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className="flex-1 rounded-md border border-border bg-secondary/40 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-3 flex items-center justify-center">
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Token output */}
              <div>
                <label className="text-xs text-muted-foreground">{side === "BUY" ? "Receive" : "Pay"} ({token.symbol})</label>
                <div className="mt-1 rounded-lg border border-border bg-secondary/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-foreground">
                      {tokenAmount > 0 ? tokenAmount.toFixed(tokenAmount < 1 ? 6 : 4) : "0"}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">{token.symbol}</span>
                  </div>
                </div>
              </div>

              {/* AI suggestion */}
              {aiSuggestion && (
                <div className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 ${
                  aiSuggestion.side === "BUY"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}>
                  <Brain className={`h-4 w-4 shrink-0 mt-0.5 ${aiSuggestion.side === "BUY" ? "text-emerald-500" : "text-red-500"}`} />
                  <div className="text-[11px] leading-relaxed">
                    <p className={`font-semibold ${aiSuggestion.side === "BUY" ? "text-emerald-500" : "text-red-500"}`}>
                      Agent says {aiSuggestion.side} · {aiSuggestion.confidence}% confidence
                    </p>
                    <p className="text-foreground mt-0.5 line-clamp-2">{aiSuggestion.reasoning_trace}</p>
                  </div>
                </div>
              )}

              {/* Stub warning */}
              {stubMode && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-500 leading-relaxed">
                    Stub mode — Circle Wallet not configured. Swap won't hit chain. Set VITE_CIRCLE_APP_ID to enable live execution.
                  </p>
                </div>
              )}

              <button
                onClick={handleSwap}
                disabled={pending || amountNum <= 0}
                className={`mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  side === "BUY" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {pending ? "Processing..." : stubMode ? `Simulate ${side}` : `${side} ${token.symbol}`}
              </button>
            </div>
          </div>

          {/* Side panel — stats + signals */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Token Stats</h3>
              <div className="space-y-1.5 text-xs">
                <Row label="Market Cap" value={fmtUsd(token.marketCap)} />
                <Row label="24h Volume" value={fmtUsd(token.volume24h)} />
                <Row label="Liquidity" value={fmtUsd(token.liquidity)} />
                <Row label="Holders" value={token.holders ? token.holders.toLocaleString() : "—"} />
                <Row label="Risk score" value={`${token.riskScore}/100`} />
              </div>
              <button
                onClick={() => navigate(`/analyzer?token=${token.symbol}`)}
                className="mt-2 w-full text-[10px] text-primary hover:underline flex items-center justify-center gap-1"
              >
                Full analysis <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> Signals on {token.symbol}
              </h3>
              {tokenSignals.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No agent signals on this token yet. Trigger the engine from the Feed to surface new signals.</p>
              ) : (
                <div className="space-y-2">
                  {tokenSignals.slice(0, 2).map((s) => (
                    <ReasoningTraceCard key={s.id} signal={s} />
                  ))}
                  {tokenSignals.length > 2 && (
                    <button
                      onClick={() => navigate(`/analyzer?token=${token.symbol}`)}
                      className="w-full text-[10px] text-primary hover:underline"
                    >
                      +{tokenSignals.length - 2} more signals →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}
