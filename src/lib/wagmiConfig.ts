import { http, createConfig } from "wagmi";
import { mainnet, bsc, polygon, arbitrum } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { arc, ARC_RPC_URL } from "./arc";

const projectId = "b4e05d3e1635c2d3e4a96f7c6a2d8f1e"; // WalletConnect Cloud project ID

export const wagmiConfig = createConfig({
  chains: [arc, mainnet, bsc, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arc.id]: http(ARC_RPC_URL),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});
