import { defineChain } from "viem";

// TODO: Replace placeholders with real values from ARC CLI output.
// Install: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`
// Docs: https://arc-node.thecanteenapp.com/
const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID) || 0;
export const ARC_RPC_URL =
  import.meta.env.VITE_ARC_RPC || "https://arc-node.thecanteenapp.com/";

export const arc = defineChain({
  id: ARC_CHAIN_ID || 421614,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://arc-node.thecanteenapp.com/" },
  },
  testnet: true,
});

export const ARC_USDC_ADDRESS =
  (import.meta.env.VITE_ARC_USDC_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
