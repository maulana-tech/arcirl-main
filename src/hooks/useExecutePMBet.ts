import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BUILDER_ID, placeOrder } from "@/lib/polymarket";
import { CIRCLE_APP_ID } from "@/lib/circle";

export interface BetRequest {
  marketId: string;
  marketQuestion?: string;
  outcomeId: string;
  outcomeLabel?: string;
  side: "BUY" | "SELL";
  price: number;
  sizeUsdc: number;
  signalId?: string;
  walletAddress?: `0x${string}`;
}

export interface BetResult {
  id: string;
  status: "PLACED" | "STUB" | "REJECTED";
  orderId?: string;
  builderFeeUsdc: number;
  message?: string;
}

// Builder fees on Polymarket are paid by the counterparty out of the standard
// spread (no extra cost to the user). The displayed fee is a conservative
// 0.5% of notional — adjust once we get exact fee tier docs from Polymarket.
const BUILDER_FEE_BPS = 50;

export function useExecutePMBet() {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<BetResult | null>(null);

  const execute = async (req: BetRequest): Promise<BetResult> => {
    if (!user) throw new Error("Sign in required");
    setPending(true);

    const builderFeeUsdc = (req.sizeUsdc * BUILDER_FEE_BPS) / 10_000;
    const canExecute = Boolean(BUILDER_ID && CIRCLE_APP_ID && req.walletAddress);

    // Insert PENDING row first so the UI always reflects intent.
    const { data: row, error: insertErr } = await supabase
      .from("bet_history")
      .insert({
        user_id: user.id,
        signal_id: req.signalId ?? null,
        market_id: req.marketId,
        market_question: req.marketQuestion ?? null,
        outcome_id: req.outcomeId,
        outcome_label: req.outcomeLabel ?? null,
        side: req.side,
        price: req.price,
        size_usdc: req.sizeUsdc,
        builder_id: BUILDER_ID ?? "unset",
        builder_fee_usdc: builderFeeUsdc,
        status: canExecute ? "PENDING" : "STUB",
      })
      .select()
      .single();

    if (insertErr || !row) {
      setPending(false);
      const fail: BetResult = {
        id: "",
        status: "REJECTED",
        builderFeeUsdc: 0,
        message: insertErr?.message ?? "Failed to record bet",
      };
      setLastResult(fail);
      return fail;
    }

    // Stub mode: BUILDER_ID or CIRCLE_APP_ID missing — return immediately.
    if (!canExecute) {
      const stub: BetResult = {
        id: row.id,
        status: "STUB",
        builderFeeUsdc,
        message: !BUILDER_ID
          ? "VITE_POLYMARKET_BUILDER_ID not set — bet recorded as stub"
          : "Circle Wallet not configured — bet recorded as stub",
      };
      setPending(false);
      setLastResult(stub);
      return stub;
    }

    // Real path: sign + submit via Polymarket CLOB.
    try {
      const result = await placeOrder({
        marketId: req.marketId,
        outcomeId: req.outcomeId,
        side: req.side,
        price: req.price,
        size: req.sizeUsdc,
        walletAddress: req.walletAddress!,
      });

      await supabase
        .from("bet_history")
        .update({
          status: result.status === "PLACED" ? "PLACED" : result.status,
          order_id: result.orderId,
          tx_hash: result.txHash ?? null,
        })
        .eq("id", row.id);

      const ok: BetResult = {
        id: row.id,
        status: "PLACED",
        orderId: result.orderId,
        builderFeeUsdc,
        message: "Bet recorded with builder code (demo mode — CLOB signing not yet implemented)",
      };
      setPending(false);
      setLastResult(ok);
      return ok;
    } catch (err: any) {
      await supabase.from("bet_history").update({ status: "REJECTED" }).eq("id", row.id);
      const fail: BetResult = {
        id: row.id,
        status: "REJECTED",
        builderFeeUsdc: 0,
        message: err?.message ?? "Execution failed",
      };
      setPending(false);
      setLastResult(fail);
      return fail;
    }
  };

  return { execute, pending, lastResult };
}

export const BUILDER_FEE_PERCENT = BUILDER_FEE_BPS / 100;
