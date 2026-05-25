import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { arc, ARC_USDC_ADDRESS } from "./arc";

// Circle App ID with fallback for demo deployment (should be set via VITE_CIRCLE_APP_ID env var)
export const CIRCLE_APP_ID = (import.meta.env.VITE_CIRCLE_APP_ID as string | undefined)
  || "b7308a79-fa57-5bed-8654-240b028aeeaf";

export interface CircleWallet {
  id: string;
  address: `0x${string}`;
  blockchain: string;
  state: "LIVE" | "FROZEN";
}

export interface UnifiedBalance {
  totalUsdc: string;
  perChain: Record<string, string>;
}

export interface PaymasterQuote {
  feeUsdc: string;
  expiresAt: number;
  payload: unknown;
}

function fnFetch(url: string, init?: RequestInit) {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
}

async function callCircleFn(action: string, body?: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/functions/v1/circle-wallet?action=${action}`;
  const res = await fnFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`circle-wallet[${action}]: ${err}`);
  }
  return res.json();
}

export async function createEmbeddedWallet(userId: string): Promise<CircleWallet> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  const data = await callCircleFn("create-wallet", { userId });
  if (data.error) throw new Error(data.error);
  return data.wallet;
}

export async function getWalletByUserId(userId: string): Promise<CircleWallet | null> {
  if (!CIRCLE_APP_ID) return null;
  try {
    const data = await callCircleFn("get-wallet", { userId });
    return data.wallet ?? null;
  } catch {
    return null;
  }
}

export async function getUnifiedBalance(walletAddress: `0x${string}`): Promise<UnifiedBalance> {
  if (!CIRCLE_APP_ID) {
    return { totalUsdc: "0", perChain: {} };
  }
  try {
    const { data: wallets } = await supabase
      .from("circle_wallets")
      .select("wallet_id")
      .eq("address", walletAddress)
      .maybeSingle();
    if (!wallets) return { totalUsdc: "0", perChain: {} };
    const data = await callCircleFn("get-balance", { walletId: wallets.wallet_id });
    const balances = data.balances ?? [];
    let totalUsdc = 0;
    const perChain: Record<string, string> = {};
    for (const b of balances) {
      if (b.token?.symbol === "USDC") {
        const amt = Number(b.amount ?? 0);
        totalUsdc += amt;
        perChain[b.blockchain ?? "unknown"] = String(amt);
      }
    }
    return { totalUsdc: String(totalUsdc), perChain };
  } catch {
    return { totalUsdc: "0", perChain: {} };
  }
}

export async function bridgeToArc(params: {
  walletAddress: `0x${string}`;
  amountUsdc: string;
  sourceChain: "ETH" | "MATIC" | "ARB" | "BASE";
}): Promise<{ txHash: `0x${string}`; arrivedAt: number }> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  const res = await fnFetch(`${SUPABASE_URL}/functions/v1/circle-wallet?action=bridge-to-arc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data;
}

export async function quotePaymasterFee(params: {
  walletAddress: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}): Promise<PaymasterQuote> {
  if (!CIRCLE_APP_ID) {
    return { feeUsdc: "0", expiresAt: 0, payload: null };
  }
  const data = await callCircleFn("quote-paymaster", {
    walletAddress: params.walletAddress,
    to: params.to,
    data: params.data,
    value: params.value?.toString() ?? "0",
  });
  return {
    feeUsdc: data.quote?.feeAmountUsdc ?? "0",
    expiresAt: data.quote?.expiresAt ?? 0,
    payload: data.quote ?? null,
  };
}

export async function sendSponsoredTx(params: {
  walletAddress: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
  paymasterQuote: PaymasterQuote;
}): Promise<{ txHash: `0x${string}` }> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  const quotePayload = params.paymasterQuote.payload as Record<string, unknown> | null;
  const data = await callCircleFn("send-sponsored-tx", {
    walletAddress: params.walletAddress,
    to: params.to,
    data: params.data,
    value: params.value?.toString() ?? "0",
    quoteId: String(quotePayload?.id ?? quotePayload?.quoteId ?? ""),
  });
  return { txHash: data.tx?.txHash ?? "0x0" };
}

export interface SwapQuote {
  fromToken: `0x${string}`;
  toToken: `0x${string}`;
  fromAmount: string;
  toAmountOut: string;
  priceImpactPct: number;
  expiresAt: number;
  payload: unknown;
}

export async function quoteSwap(params: {
  fromToken: `0x${string}`;
  toToken: `0x${string}`;
  fromAmount: string;
  walletAddress: `0x${string}`;
}): Promise<SwapQuote> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  throw new Error("quoteSwap: Circle App Kit not installed — install @circle-fin/circle-sdk");
}

export async function executeSwap(params: {
  quote: SwapQuote;
  walletAddress: `0x${string}`;
  sponsorWithPaymaster?: boolean;
}): Promise<{ txHash: `0x${string}` }> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  throw new Error("executeSwap: Circle App Kit not installed — install @circle-fin/circle-sdk");
}

export { arc, ARC_USDC_ADDRESS };
