import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, TrendingUp, Activity, Filter, RefreshCw } from "lucide-react";
import { usePMMarkets } from "@/hooks/usePolymarket";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";

function fmtUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function timeUntil(iso: string): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hrs = Math.floor(ms / 3_600_000);
  return `${hrs}h`;
}

const CATEGORIES = ["All", "Politics", "Crypto", "Sports", "Economy", "Tech"];

export default function PredictionMarkets() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [withSignalsOnly, setWithSignalsOnly] = useState(false);
  const { markets, loading, error, refetch } = usePMMarkets({
    limit: 100,
    category: category === "All" ? undefined : category.toLowerCase(),
  });
  const { signals } = useUnifiedSignals({ venue: "polymarket", limit: 100 });

  const signalsByMarket = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of signals) {
      map.set(s.market_id, (map.get(s.market_id) ?? 0) + 1);
    }
    return map;
  }, [signals]);

  const filtered = useMemo(() => {
    let xs = markets;
    if (withSignalsOnly) xs = xs.filter((m) => signalsByMarket.has(m.id) || signalsByMarket.has(m.conditionId));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      xs = xs.filter((m) => m.question.toLowerCase().includes(q));
    }
    return xs;
  }, [markets, withSignalsOnly, search, signalsByMarket]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Prediction Markets</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Polymarket live · agent-flagged markets carry a signal badge
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setWithSignalsOnly((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
              withSignalsOnly ? "bg-emerald-500/15 text-emerald-500" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="h-3 w-3" /> Signal-flagged only
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading markets…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
          <p className="text-sm text-foreground font-medium">No markets match</p>
          <p className="mt-1 text-xs text-muted-foreground">Adjust filters or refresh.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((m) => {
          const signalCount = signalsByMarket.get(m.id) ?? signalsByMarket.get(m.conditionId) ?? 0;
          const yesPx = m.outcomes[0]?.price ?? 0;
          const noPx = m.outcomes[1]?.price ?? 0;
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/markets/${encodeURIComponent(m.id)}`)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm font-semibold text-foreground line-clamp-3">{m.question}</p>
                {signalCount > 0 && (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 whitespace-nowrap">
                    {signalCount} signal{signalCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-1.5">
                  <div className="text-[10px] text-emerald-500/70">YES</div>
                  <div className="text-sm font-mono font-bold text-emerald-500">{(yesPx * 100).toFixed(0)}¢</div>
                </div>
                <div className="flex-1 rounded-lg bg-red-500/10 px-3 py-1.5">
                  <div className="text-[10px] text-red-500/70">NO</div>
                  <div className="text-sm font-mono font-bold text-red-500">{(noPx * 100).toFixed(0)}¢</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Vol {fmtUsd(m.volume)}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Liq {fmtUsd(m.liquidity)}
                </span>
                <span>ends in {timeUntil(m.endDate)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
