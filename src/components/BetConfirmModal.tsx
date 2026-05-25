import { useState } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, AlertTriangle, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useExecutePMBet, BUILDER_FEE_PERCENT, BetRequest } from "@/hooks/useExecutePMBet";
import { BUILDER_ID } from "@/lib/polymarket";
import { CIRCLE_APP_ID } from "@/lib/circle";

interface Props {
  open: boolean;
  onClose: () => void;
  market: {
    id: string;
    question: string;
    outcomeId: string;
    outcomeLabel: string;
    price: number; // current price for that outcome (0..1)
  };
  signalId?: string;
  signalReasoning?: string;
}

export default function BetConfirmModal({ open, onClose, market, signalId, signalReasoning }: Props) {
  const [size, setSize] = useState<string>("10");
  const [side] = useState<"BUY" | "SELL">("BUY"); // default BUY the chosen outcome
  const { execute, pending } = useExecutePMBet();
  const { address, isConnected } = useAccount();

  if (!open) return null;

  const sizeNum = Number(size) || 0;
  const fee = (sizeNum * BUILDER_FEE_PERCENT) / 100;
  const stubMode = !BUILDER_ID || !CIRCLE_APP_ID || !isConnected;

  const handleConfirm = async () => {
    if (sizeNum <= 0) {
      toast.error("Enter a positive USDC amount");
      return;
    }
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    const req: BetRequest = {
      marketId: market.id,
      marketQuestion: market.question,
      outcomeId: market.outcomeId,
      outcomeLabel: market.outcomeLabel,
      side,
      price: market.price,
      sizeUsdc: sizeNum,
      signalId,
      walletAddress: address,
    };
    const result = await execute(req);
    if (result.status === "PLACED") {
      toast.success("Bet placed via builder code");
      onClose();
    } else if (result.status === "STUB") {
      toast.message("Recorded as stub", { description: result.message });
      onClose();
    } else {
      toast.error(result.message ?? "Bet rejected");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">Confirm Bet</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Market */}
          <div>
            <p className="text-xs text-muted-foreground">Market</p>
            <p className="mt-1 text-sm text-foreground line-clamp-2">{market.question}</p>
          </div>

          {/* Outcome + price */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buying</p>
              <p className="text-sm font-semibold text-foreground">{market.outcomeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
              <p className="text-sm font-mono font-bold text-foreground">{(market.price * 100).toFixed(1)}¢</p>
            </div>
          </div>

          {/* Size input */}
          <div>
            <label className="text-xs text-muted-foreground">Size (USDC)</label>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-mono"
            />
            <div className="mt-2 flex gap-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSize(String(preset))}
                  className="flex-1 rounded-md border border-border bg-secondary/40 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payoff */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
            <Row label="Max payout" value={`$${(sizeNum / Math.max(market.price, 0.001)).toFixed(2)}`} accent="emerald" />
            <Row label="Cost" value={`$${sizeNum.toFixed(2)}`} />
            <Row
              label={<span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Builder fee ({BUILDER_FEE_PERCENT}%)</span>}
              value={`~$${fee.toFixed(2)}`}
              hint="paid by counterparty"
            />
          </div>

          {/* Signal context */}
          {signalReasoning && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary mb-1">
                <Sparkles className="h-3 w-3" /> Signal reasoning
              </p>
              <p className="text-[11px] text-foreground leading-relaxed line-clamp-4">{signalReasoning}</p>
            </div>
          )}

          {/* Stub warning */}
          {stubMode && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-500 leading-relaxed">
                {!BUILDER_ID ? "VITE_POLYMARKET_BUILDER_ID not set" : "Circle Wallet not configured"} — bet will be recorded as a stub for demo purposes. No on-chain order will be placed.
              </p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={pending || sizeNum <= 0}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {pending ? "Placing..." : (
              <>
                <TrendingUp className="h-4 w-4" />
                {stubMode ? "Record bet (stub)" : "Place bet"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, accent, hint }: { label: React.ReactNode; value: string; accent?: "emerald"; hint?: string }) {
  const valueColor = accent === "emerald" ? "text-emerald-500" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${valueColor}`}>
        {value}
        {hint && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">({hint})</span>}
      </span>
    </div>
  );
}
