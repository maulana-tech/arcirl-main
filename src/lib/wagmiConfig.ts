import { http, createConfig } from "wagmi";
import { mainnet, bsc, polygon, arbitrum } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { arc, ARC_RPC_URL } from "./arc";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "3f9229ce71cbb2c3fa97618d1add0643";

export const wagmiConfig = createConfig({
  chains: [arc, mainnet, bsc, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arc.id]: http(ARC_RPC_URL),
    [mainnet.id]: http("https://cloudflare-eth.com"),
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
    [polygon.id]: http("https://polygon-rpc.com"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
  },
});
