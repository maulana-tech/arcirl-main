# Arcirl AI — Agent Instructions

Concise dev guide. For the bigger picture see [`CLAUDE.md`](./CLAUDE.md), for product/hackathon context see [`PLANNING.md`](./PLANNING.md) and [`CONTEXT.md`](./CONTEXT.md).

## Dev Commands

```bash
bun run dev          # dev server on port 8080
bun run build        # production build
bun run build:dev    # dev build (enables component tagger)
bun run lint         # eslint
bun run test         # vitest run
bun run test:watch   # vitest watch
bun run preview      # vite preview
```

No typecheck script. ESLint uses `typescript-eslint`.

Contracts (Foundry):
```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## Stack

- **Package manager**: bun (`bun.lock` + `bun.lockb` authoritative; `package.json` `packageManager` field is stale). If `bun install` hangs, fallback to `npm install`.
- **Framework**: Vite 5 + React 18 + TypeScript 5
- **UI**: shadcn/ui (style: default, baseColor: slate) + Tailwind CSS 3 + Radix
- **Routing**: react-router-dom v6
- **Web3**: wagmi v3 + viem v2 + WalletConnect — chains: **arc** (custom L1), mainnet, bsc, polygon, arbitrum
- **Backend**: Supabase (auth, Postgres, Realtime, pg_cron, edge functions)
- **LLM**: NVIDIA (`meta/llama-3.3-70b-instruct`) or Anthropic (`claude-sonnet-4-20250514`) via `signal-engine` edge function
- **Data fetching**: @tanstack/react-query v5
- **Charts**: lightweight-charts, recharts, framer-motion
- **Testing**: vitest 3 (unit) + @playwright/test (e2e via lovable-agent-playwright-config)
- **Contracts**: Solidity 0.8.24 + Foundry → Arc testnet

## Vite Plugin Note

Uses `@vitejs/plugin-react` (Babel) instead of `@vitejs/plugin-react-swc` because the SWC native binary crashes on Node v22 + macOS x64. If SWC ever works, revert to `@vitejs/plugin-react-swc` for faster builds.

## Path Alias

`@` maps to `src/`. Resolved in Vite, Vitest, and tsconfig.

## Architecture

- `src/App.tsx` — provider stack: WagmiProvider → QueryClientProvider → TooltipProvider → Sonner → BrowserRouter → AuthProvider → Routes. All routes wrapped in `AppLayout` except `/auth`.
- `src/lib/` — chain configs + SDK wrappers: `arc.ts`, `wagmiConfig.ts`, `circle.ts`, `polymarket.ts`, plus fallback price oracles `binance.ts` / `coingecko.ts` / `cryptocompare.ts`.
- `src/hooks/` — data layer: `useSmartWallets` (multi-venue tracker), `useUnifiedSignals` (realtime signal feed), `useExecutePMBet` (bet exec with builder code), `usePerpsIntel` (HL whale positions), `usePolymarket` (market reads), `useAVEWallet` (onchain inspect). Plus generic utilities.
- `src/pages/` — Index (signal feed), PredictionMarkets / MarketDetail, PerpsIntel, SmartMoney / WalletDetail, Portfolio, Alerts, Profile, Settings, Admin, Auth, NotFound.
- `src/components/` — `ReasoningTraceCard`, `BetConfirmModal`, `BuilderFeeWidget`, dashboard/layout/ui (shadcn).
- `src/contexts/AuthContext.tsx` — Supabase auth. Auth strategy: Supabase (identity) + Circle Wallets (on-chain execution).
- `src/integrations/supabase/client.ts` — **auto-generated, do not edit**.
- `supabase/functions/` — `signal-engine`, `hyperliquid-fetch`, `polymarket-traders`, `ave-wallet`, `ave-token`, `ave-klines`, `wallet-scan`.
- `supabase/migrations/` — `tracked_wallets.venue`, `signals`, `bet_history`.
- `contracts/` — Foundry workspace with `LeaderBond.sol`.

## Vite Config

Dev server `:::8080`, HMR overlay disabled. `componentTagger` (from `lovable-tagger`) only in development mode. Deduplicates: react, react-dom, react/jsx-runtime, react/jsx-dev-runtime, @tanstack/react-query, @tanstack/query-core.

To run dev locally: `npm run dev` (use npm, not bun, if bun hangs on your system).

## TypeScript

`noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `allowJs: true`, `skipLibCheck: true`.

## Tailwind

Dark mode via `class`. Custom neon palette (`neon-pink/green/blue/purple/orange`) in `tailwind.config.ts`. Plugins: `tailwindcss-animate`, `@tailwindcss/typography`. Fonts: heading & body = Space Grotesk, mono = JetBrains Mono.

## Test Setup

Vitest: jsdom environment + globals. Setup `src/test/setup.ts` (matchMedia polyfill + @testing-library/jest-dom). Test glob `src/**/*.{test,spec}.{ts,tsx}`. Playwright fixture re-exports `lovable-agent-playwright-config/fixture`; config at `playwright.config.ts` via `createLovableConfig`.

## ESLint

Ignores `dist`. `@typescript-eslint/no-unused-vars` off. `react-refresh/only-export-components` warn-only.

## Env vars

| Var | Where | Required for |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Always |
| `VITE_CIRCLE_APP_ID` | client | Live Circle Wallets + Paymaster + Gateway |
| `VITE_POLYMARKET_BUILDER_ID` | client | Live bet execution + fee attribution |
| `VITE_ARC_CHAIN_ID`, `VITE_ARC_RPC`, `VITE_ARC_USDC_ADDRESS` | client | Arc L1 wallet + USDC settlement |
| `ANTHROPIC_API_KEY` | Supabase secret | Live `signal-engine` (stub mode if unset) |

`.env.example` documents all keys. **Never commit `.env*`**.

## Stub-vs-live modes

App is demoable without external setup. Stub fallback active when env vars unset:
- `signal-engine` returns deterministic stub signals (`is_stub: true`).
- `useExecutePMBet` records bets with `status: STUB` and surfaces an amber disclosure in `BetConfirmModal`.

Switch to live by populating the env vars above + registering builder code + deploying `LeaderBond.sol`.

## Deployment

`vercel.json` with SPA rewrite (`/(.*)` → `/index.html`). No CI config.

## Generated / ignore

- `.lovable/` — build-time component tagging artifacts, safe to ignore.
- `src/integrations/supabase/client.ts` — auto-generated, do not edit.
