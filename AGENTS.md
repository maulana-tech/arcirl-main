# Vicso AI — Agent Instructions

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

No typecheck script. ESLint uses `typescript-eslint` internally.

## Stack

- **Package manager**: bun (bun.lock + bun.lockb are authoritative; `package.json` `packageManager` field is stale)
- **Framework**: Vite 5 + React 18 + TypeScript 5
- **UI**: shadcn/ui (style: default, baseColor: slate, cssVariables) + Tailwind CSS 3 + Radix primitives
- **Routing**: react-router-dom v6
- **Web3**: wagmi v3 + viem v2 + WalletConnect (chains: mainnet, bsc, polygon, arbitrum; connectors: injected, walletConnect)
- **Backend**: Supabase (@supabase/supabase-js) + Edge Functions (supabase/functions/)
- **Data fetching**: @tanstack/react-query v5
- **Charts**: lightweight-charts, recharts, framer-motion
- **Testing**: vitest 3 (unit) + @playwright/test (e2e via lovable-agent-playwright-config)

## Path Alias

`@` maps to `src/`. Resolved in Vite, Vitest, and tsconfig.

## Architecture

- `src/App.tsx` — root component with provider nesting: WagmiProvider → QueryClientProvider → TooltipProvider → Sonner → BrowserRouter → AuthProvider → Routes
- All routes wrapped in `AppLayout` except `/auth`
- Pages in `src/pages/`, components in `src/components/`, hooks in `src/hooks/`
- shadcn/ui in `src/components/ui/`
- `src/lib/` — wagmi config, API wrappers (coingecko, binance, cryptocompare, sosovalue, sodex), utils
- Supabase auth in `src/contexts/AuthContext.tsx`; client auto-generated at `src/integrations/supabase/client.ts` (do not edit)
- Supabase Edge Functions in `supabase/functions/` (openclaw-chat, ai-analyze, wallet-scan, ave-wallet, ave-token, ave-klines)
- Wagmi config at `src/lib/wagmiConfig.ts` (WalletConnect project ID hardcoded)

## Vite Config

Dev server on `:::8080`, HMR overlay disabled. `componentTagger` from `lovable-tagger` runs only in development mode. Deduplicates: react, react-dom, react/jsx-runtime, react/jsx-dev-runtime, @tanstack/react-query, @tanstack/query-core.

## TypeScript

`noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `allowJs: true`, `skipLibCheck: true`.

## Tailwind

Dark mode via `class`. Custom neon color palette (`neon-pink/green/blue/purple/orange`) in `tailwind.config.ts`. Uses `tailwindcss-animate` + `@tailwindcss/typography` plugins. Font families: `heading` (Space Grotesk), `body` (Space Grotesk), `mono` (JetBrains Mono).

## Test Setup

Vitest: jsdom environment with globals. Setup: `src/test/setup.ts` (matchMedia polyfill + @testing-library/jest-dom). Test files: `src/**/*.{test,spec}.{ts,tsx}`. E2E: `playwright-fixture.ts` re-exports from `lovable-agent-playwright-config/fixture`; config at `playwright.config.ts` via `createLovableConfig`.

## ESLint

Ignores `dist`. `@typescript-eslint/no-unused-vars` is off. React Refresh `only-export-components` is warn-only.

## Env vars

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (project ID: `iikuixprsdulnrffedoi`)
- `VITE_SOSOVALUE_API_KEY` (required for market data)
- `VITE_SODEX_API_KEY` (optional, for on-chain trading)
- `.env.example` exists with all keys documented

## Deployment

`vercel.json` with SPA rewrite rules (`/(.*)` → `/index.html`). No CI config found (no `.github/`).

## Generated / ignore

- `.lovable/` — build-time component tagging artifacts, safe to ignore
- `src/integrations/supabase/client.ts` — auto-generated Supabase client, do not edit
