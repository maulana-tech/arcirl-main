// Circle developer platform wrappers — Wallets, Paymaster, Gateway.
// Docs: https://developers.circle.com
//
// These are stub interfaces. Real SDK wiring happens once VITE_CIRCLE_APP_ID
// is provisioned. Keep the surface area stable so call sites don't churn.

import { arc, ARC_USDC_ADDRESS } from "./arc";

export const CIRCLE_APP_ID = import.meta.env.VITE_CIRCLE_APP_ID as string | undefined;

export interface CircleWallet {
  id: string;
  address: `0x${string}`;
  blockchain: "ARC" | "ETH" | "MATIC" | "ARB" | "BASE";
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

// ─── Wallets ────────────────────────────────────────────────────────────────
// Embedded wallet provisioning at signup. Maps Supabase user.id → Circle wallet.

export async function createEmbeddedWallet(userId: string): Promise<CircleWallet> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  // TODO: call Circle Wallets SDK. Returns wallet bound to user, deployed on Arc.
  throw new Error("createEmbeddedWallet: not implemented — pending Circle App ID");
}

export async function getWalletByUserId(userId: string): Promise<CircleWallet | null> {
  if (!CIRCLE_APP_ID) return null;
  // TODO: query Circle SDK for wallet associated with userId.
  return null;
}

// ─── Gateway ────────────────────────────────────────────────────────────────
// Unified USDC balance across chains. Sub-500ms cross-chain transfers.

export async function getUnifiedBalance(walletAddress: `0x${string}`): Promise<UnifiedBalance> {
  if (!CIRCLE_APP_ID) {
    return { totalUsdc: "0", perChain: {} };
  }
  // TODO: Gateway SDK call — aggregate USDC across supported chains.
  throw new Error("getUnifiedBalance: not implemented");
}

export async function bridgeToArc(params: {
  walletAddress: `0x${string}`;
  amountUsdc: string;
  sourceChain: "ETH" | "MATIC" | "ARB" | "BASE";
}): Promise<{ txHash: `0x${string}`; arrivedAt: number }> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  // TODO: Gateway transfer source → Arc destination.
  throw new Error("bridgeToArc: not implemented");
}

// ─── Paymaster ──────────────────────────────────────────────────────────────
// Gas in USDC, not volatile native token. Critical UX for high-frequency betting.

export async function quotePaymasterFee(params: {
  walletAddress: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}): Promise<PaymasterQuote> {
  if (!CIRCLE_APP_ID) {
    return { feeUsdc: "0", expiresAt: 0, payload: null };
  }
  // TODO: Paymaster RPC quote for sponsorship in USDC.
  throw new Error("quotePaymasterFee: not implemented");
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
  // TODO: submit tx through Paymaster bundler.
  throw new Error("sendSponsoredTx: not implemented");
}

// ─── App Kit · Swap ──────────────────────────────────────────────────────────
// Wraps Circle App Kit's Swap component. Per-call quote then signed execution
// through the user's embedded wallet. Same chain only — cross-chain goes
// through Gateway.

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
  // TODO: Call Circle App Kit Swap quote endpoint.
  throw new Error("quoteSwap: not implemented");
}

export async function executeSwap(params: {
  quote: SwapQuote;
  walletAddress: `0x${string}`;
  sponsorWithPaymaster?: boolean;
}): Promise<{ txHash: `0x${string}` }> {
  if (!CIRCLE_APP_ID) {
    throw new Error("VITE_CIRCLE_APP_ID not configured");
  }
  // TODO: Sign + submit. If sponsorWithPaymaster, route through Paymaster.
  throw new Error("executeSwap: not implemented");
}

// ─── Constants re-export for convenience ─────────────────────────────────────
export { arc, ARC_USDC_ADDRESS };
