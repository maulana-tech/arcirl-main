import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Search, Bell, BellOff, Star, Copy, X, RefreshCw, Users, Scan,
  TrendingUp, TrendingDown, Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSmartWallets, WalletVenue,
  fetchTopHLTraders, fetchTopPMTraders, TopHLTrader, TopPMTrader,
} from "@/hooks/useSmartWallets";
import SmartMoneyWallets from "@/components/SmartMoneyWallets";
import { toast } from "sonner";

const VENUES: { key: WalletVenue; label: string; hint: string }[] = [
  { key: "onchain", label: "Onchain", hint: "EVM + Solana wallets via Moralis/AVE" },
  { key: "hyperliquid", label: "Hyperliquid", hint: "Perp whales — leading indicator for PM bets" },
  { key: "polymarket", label: "Polymarket", hint: "Prediction-market alpha traders" },
];

const ONCHAIN_CHAINS = [
  { value: "ETH", label: "Ethereum", scanChain: "eth" },
  { value: "BNB", label: "BNB Chain", scanChain: "bsc" },
  { value: "SOL", label: "Solana", scanChain: "solana" },
  { value: "MATIC", label: "Polygon", scanChain: "polygon" },
  { value: "ARB", label: "Arbitrum", scanChain: "arbitrum" },
  { value: "TRX", label: "TRON", scanChain: "tron" },
  { value: "SUI", label: "Sui", scanChain: "sui" },
];

function isValidAddressForVenue(addr: string, venue: WalletVenue, chain?: string): boolean {
  if (!addr || addr.length < 10) return false;
  if (venue === "hyperliquid" || venue === "polymarket") return /^0x[a-fA-F0-9]{40}$/.test(addr);
  if (chain === "SOL" || chain === "SUI") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  if (chain === "TRX") return /^T[a-zA-Z0-9]{33}$/.test(addr);
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function SmartMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeVenue, setActiveVenue] = useState<WalletVenue>("onchain");
  const { wallets, loading, refetch, addWallet, removeWallet, toggleNotifications } =
    useSmartWallets(activeVenue);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchChain, setSearchChain] = useState("ETH");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newChain, setNewChain] = useState("ETH");

  const [hlTraders, setHLTraders] = useState<TopHLTrader[]>([]);
  const [pmTraders, setPMTraders] = useState<TopPMTrader[]>([]);
  const [topLoading, setTopLoading] = useState(false);

  useEffect(() => {
    if (activeVenue === "hyperliquid") {
      setTopLoading(true);
      fetchTopHLTraders(15).then((t) => setHLTraders(t)).finally(() => setTopLoading(false));
    } else if (activeVenue === "polymarket") {
      setTopLoading(true);
      fetchTopPMTraders(15).then((t) => setPMTraders(t)).finally(() => setTopLoading(false));
    }
  }, [activeVenue]);

  const handleScanWallet = () => {
    if (!searchQuery.trim()) { toast.error("Enter a wallet address"); return; }
    if (!isValidAddressForVenue(searchQuery, "onchain", searchChain)) {
      toast.error(`Invalid ${searchChain} address format`);
      return;
    }
    const chain = ONCHAIN_CHAINS.find((c) => c.value === searchChain);
    navigate(`/smart-money/${encodeURIComponent(searchQuery)}?chain=${chain?.scanChain || "eth"}&venue=onchain`);
  };

  const handleAddWallet = async () => {
    const chainCtx = activeVenue === "onchain" ? newChain : undefined;
    if (!isValidAddressForVenue(newAddress, activeVenue, chainCtx)) {
      toast.error("Invalid address for selected venue");
      return;
    }
    if (!user) { toast.error("Sign in to track wallets"); return; }
    try {
      await addWallet({
        address: newAddress,
        label: newLabel || `${VENUES.find((v) => v.key === activeVenue)?.label} ${wallets.length + 1}`,
        chain: activeVenue === "onchain" ? newChain : null,
        venue: activeVenue,
      });
      toast.success("Wallet added to tracking");
      setShowAddModal(false);
      setNewAddress("");
      setNewLabel("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add wallet");
    }
  };

  const navigateToWallet = (address: string, venue: WalletVenue, chain?: string | null) => {
    const c = ONCHAIN_CHAINS.find((ch) => ch.value === chain);
    const chainParam = venue === "onchain" ? `&chain=${c?.scanChain || "eth"}` : "";
    navigate(`/smart-money/${encodeURIComponent(address)}?venue=${venue}${chainParam}`);
  };

  const filtered = wallets.filter(
    (w) =>
      !searchQuery ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.label || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const venueHint = useMemo(() => VENUES.find((v) => v.key === activeVenue)?.hint ?? "", [activeVenue]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Smart Money Feed</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{venueHint}</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Track {VENUES.find((v) => v.key === activeVenue)?.label}
            </button>
          )}
          <button
            onClick={refetch}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Venue Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
        {VENUES.map((v) => (
          <button
            key={v.key}
            onClick={() => setActiveVenue(v.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeVenue === v.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Onchain Scanner — only for onchain venue */}
      {activeVenue === "onchain" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-3 sm:p-5"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" /> Scan Onchain Wallet
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanWallet()}
                placeholder="Enter wallet address (0x...)"
                className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={searchChain}
                onChange={(e) => setSearchChain(e.target.value)}
                className="flex-1 sm:flex-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {ONCHAIN_CHAINS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handleScanWallet}
                className="rounded-lg bg-primary px-4 sm:px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Scan className="h-3.5 w-3.5" /> Scan
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
          <p className="font-heading text-lg sm:text-xl font-bold text-primary">{wallets.length}</p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">Tracked</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
          <p className="font-heading text-lg sm:text-xl font-bold text-emerald-500">{wallets.filter((w) => w.notifications_on).length}</p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">Alerts On</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
          <p className="font-heading text-lg sm:text-xl font-bold text-cyan-500">
            {activeVenue === "onchain" ? new Set(wallets.map((w) => w.chain)).size : "—"}
          </p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">
            {activeVenue === "onchain" ? "Chains" : "Venue"}
          </p>
        </motion.div>
      </div>

      {!user && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 sm:p-6 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">Sign in to track wallets</p>
          <p className="text-xs text-muted-foreground mt-1">Sign in to save your watchlist across venues</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {user && loading && <p className="text-sm text-muted-foreground text-center py-8">Loading wallets...</p>}

      {user && !loading && wallets.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 sm:p-6 text-center">
          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">No {VENUES.find((v) => v.key === activeVenue)?.label} wallets tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Track {VENUES.find((v) => v.key === activeVenue)?.label}" above, or pick from the suggestions below</p>
        </div>
      )}

      {filtered.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Your Tracked
          </h3>
          <div className="space-y-2">
            {filtered.map((w) => (
              <div key={w.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">{w.label || "Unnamed"}</span>
                  <button
                    onClick={() => navigateToWallet(w.address, w.venue, w.chain)}
                    className="font-mono text-[10px] text-primary hover:underline truncate"
                  >
                    {w.address.slice(0, 8)}...{w.address.slice(-4)}
                  </button>
                  {w.chain && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{w.chain}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleNotifications(w.id, !!w.notifications_on)}
                    className={`p-1.5 rounded transition-colors ${w.notifications_on ? "text-emerald-500" : "text-muted-foreground"}`}
                  >
                    {w.notifications_on ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Copied"); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeWallet(w.id)}
                    className="p-1.5 text-red-500/60 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top traders per venue */}
      {activeVenue === "hyperliquid" && (
        <TopTradersHL
          traders={hlTraders}
          loading={topLoading}
          onTrack={(addr) => navigate(`/smart-money/${encodeURIComponent(addr)}?venue=hyperliquid`)}
          onAdd={(addr) => addWallet({ address: addr, venue: "hyperliquid", label: `HL ${addr.slice(0, 6)}` })}
        />
      )}

      {activeVenue === "polymarket" && (
        <TopTradersPM
          traders={pmTraders}
          loading={topLoading}
          onTrack={(addr) => navigate(`/smart-money/${encodeURIComponent(addr)}?venue=polymarket`)}
          onAdd={(addr) => addWallet({ address: addr, venue: "polymarket", label: `PM ${addr.slice(0, 6)}` })}
        />
      )}

      {activeVenue === "onchain" && <SmartMoneyWallets />}

      {/* Add wallet modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Track {VENUES.find((v) => v.key === activeVenue)?.label} Wallet
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Wallet Address</label>
                <input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder={activeVenue === "onchain" ? "0x..., T..., or Solana address" : "0x..."}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Label (optional)</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Whale 1"
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              {activeVenue === "onchain" && (
                <div>
                  <label className="text-xs text-muted-foreground">Chain</label>
                  <select
                    value={newChain}
                    onChange={(e) => setNewChain(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {ONCHAIN_CHAINS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
              )}
              <button
                onClick={handleAddWallet}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add Wallet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Venue-specific suggested-traders sections ──────────────────────────────

function TopTradersHL({
  traders, loading, onTrack, onAdd,
}: {
  traders: TopHLTrader[];
  loading: boolean;
  onTrack: (addr: string) => void;
  onAdd: (addr: string) => Promise<void> | void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-cyan-500" />
        <h3 className="font-heading text-sm font-semibold text-foreground">Top Hyperliquid Whales</h3>
      </div>
      {loading && <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>}
      {!loading && traders.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No traders returned — check edge function deployment.</p>
      )}
      <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin">
        {traders.map((t) => (
          <div key={t.address} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-2.5 sm:p-3">
            <button onClick={() => onTrack(t.address)} className="flex items-center gap-2 min-w-0 text-left">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${t.pnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {t.pnl >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-foreground">{t.address.slice(0, 8)}...{t.address.slice(-4)}</p>
                <p className="text-[10px] text-muted-foreground">Account: {fmtUsd(t.accountValue)}</p>
              </div>
            </button>
            <button
              onClick={() => onAdd(t.address)}
              className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              + Track
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopTradersPM({
  traders, loading, onTrack, onAdd,
}: {
  traders: TopPMTrader[];
  loading: boolean;
  onTrack: (addr: string) => void;
  onAdd: (addr: string) => Promise<void> | void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="font-heading text-sm font-semibold text-foreground">Top Polymarket Traders</h3>
      </div>
      {loading && <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>}
      {!loading && traders.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">Leaderboard endpoint returned no traders — endpoint shape may have shifted; surface raw response when wiring fees.</p>
      )}
      <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin">
        {traders.map((t) => (
          <div key={t.address} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-2.5 sm:p-3">
            <button onClick={() => onTrack(t.address)} className="flex items-center gap-2 min-w-0 text-left">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${t.pnlUsdc >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {t.pnlUsdc >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground font-semibold truncate">{t.username || `${t.address.slice(0, 8)}...${t.address.slice(-4)}`}</p>
                <p className="text-[10px] text-muted-foreground">PnL {fmtUsd(t.pnlUsdc)} · Vol {fmtUsd(t.volumeUsdc)}</p>
              </div>
            </button>
            <button
              onClick={() => onAdd(t.address)}
              className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              + Track
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
