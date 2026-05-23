import { defineChain } from "viem";

const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID) || 5042002;
export const ARC_RPC_URL =
  import.meta.env.VITE_ARC_RPC || "https://rpc.testnet.arc.network";

export const arc = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export const ARC_USDC_ADDRESS =
  (import.meta.env.VITE_ARC_USDC_ADDRESS as `0x${string}`) || "0x3600000000000000000000000000000000000000";
