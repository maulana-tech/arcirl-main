# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

**Visco AI — Smart Money Copy Agent** — Agora Agents Hackathon submission (hosted by Canteen, powered by Circle & Arc).

Cross-venue autonomous copy-trading agent: tracks Hyperliquid whales + Polymarket alpha traders + onchain wallets, generates +EV signals via a Claude-backed reasoning loop, executes Polymarket bets via builder codes (earning USDC fees), and settles on Arc. The full plan and delivery log is in [`PLANNING.md`](./PLANNING.md); product/hackathon context is in [`CONTEXT.md`](./CONTEXT.md).

**Brand:** Visco AI (kept across migration). **Settlement:** Arc L1. **LLM:** Anthropic Claude (Opus 4.7 / Sonnet 4.6) via edge function.

## Commands

```bash
bun run dev          # Vite dev server on port 8080 (HMR overlay disabled)
bun run build        # Production build
bun run build:dev    # Development build (enables lovable-tagger componentTagger)
bun run lint         # ESLint (no autofix script)
bun run test         # Vitest single run
bun run test:watch   # Vitest watch mode
bun x vitest run src/path/to/file.test.ts   # Run a single test file
bun run preview      # Preview production build
```

**No typecheck script.** Type errors surface only through the IDE or `bun run build`. ESLint uses `typescript-eslint` internally.

**E2E** (Playwright) tests live in `e2e/` and use `lovable-agent-playwright-config` — invoke with `bun x playwright test`; no npm script wired up.

**Contracts** (`contracts/`) use Foundry:
```bash
cd contracts && forge install foundry-rs/forge-std --no-commit
forge build
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## Stack & Conventions

- **Package manager**: bun (both `bun.lock` and `bun.lockb` committed). `package.json` has a stale `packageManager: yarn@...` field but bun is what's actually used.
- **Path alias**: `@` → `src/`. Resolved in both `vite.config.ts` and `vitest.config.ts`.
- **TypeScript is loose**: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals/Parameters: false`. Don't add strictness unilaterally.
- **ESLint**: `@typescript-eslint/no-unused-vars` is **off**; `react-refresh/only-export-components` is warn-only. Ignores `dist`.
- **Vite dedupe** is critical: react, react-dom, react/jsx-runtime, @tanstack/react-query, @tanstack/query-core are explicitly deduplicated — preserve this when modifying `vite.config.ts`.

## Architecture

**Data flow:** `Smart Wallet Tracker (HL + PM + onchain) → Signal Engine (LLM reasoning, pg_cron 5-min) → Polymarket Execution (builder code) + Slash-Bond Contracts (Arc)`.

- **`src/App.tsx`** is the root: wraps everything in `WagmiProvider` → `QueryClientProvider` → `TooltipProvider` → `BrowserRouter` → `AuthProvider`. All routes except `/auth` are wrapped in `AppLayout` via a nested `<Routes>` setup — preserve that two-level routing pattern when adding pages.

### Routes & pages

| Route | Page | Purpose |
|---|---|---|
| `/` | `Index.tsx` | Autonomous signal feed (Supabase Realtime) + `BuilderFeeWidget` |
| `/markets` | `PredictionMarkets.tsx` | Polymarket browser, filterable by signal coverage |
| `/markets/:marketId` | `MarketDetail.tsx` | Single market + agent reasoning + bet flow |
| `/perps` | `PerpsIntel.tsx` | Top Hyperliquid whales' positions (leading indicator for PM bets) |
| `/trading` | `Trading.tsx` | Whale-driven token swap (Circle Wallet stub mode; sources signals + AVE data) |
| `/analyzer` | `TokenAnalyzer.tsx` | Per-token risk + agent signals + smart-money exposure cross-links |
| `/ai` | `AICommandCenter.tsx` | Conversational chat to the agent — context: live signals, tracked wallets, bet history |
| `/smart-money` | `SmartMoney.tsx` | Venue-tabbed wallet tracker (HL / PM / Onchain) |
| `/smart-money/:address` | `WalletDetail.tsx` | Per-wallet activity (venue-aware via `?venue=` query) |
| `/portfolio`, `/alerts`, `/profile`, `/settings`, `/admin`, `/auth` | (stock pages) | Identity + admin shells |

### `src/lib/`

- `arc.ts` — Arc L1 viem chain config (placeholder chain ID until `VITE_ARC_CHAIN_ID` set)
- `circle.ts` — Circle Wallets + Paymaster + Gateway SDK wrappers (stubs throw without `VITE_CIRCLE_APP_ID`)
- `polymarket.ts` — Polymarket CLOB client; `placeOrder()` attaches `BUILDER_ID` on every order
- `wagmiConfig.ts` — wagmi v3 config: Arc + Ethereum + BSC + Polygon + Arbitrum
- `binance.ts`, `coingecko.ts`, `cryptocompare.ts` — fallback price oracles (kept from pre-migration)
- `utils.ts` — `cn()` for Tailwind class merging

### `src/hooks/`

| Hook | Purpose |
|---|---|
| `useSmartWallets(venue)` | Multi-venue tracked-wallet CRUD on Supabase `tracked_wallets` |
| `useUnifiedSignals({venue?, limit?})` | Realtime-subscribed signal feed; exports `triggerSignalEngine()` |
| `useExecutePMBet` | Bet execution; logs to `bet_history`; builder code attached; stub mode when env unset |
| `useAgentChat` | Conversational interface to `agent-chat` edge function (Anthropic with stub fallback) |
| `usePerpsIntel` | Top HL traders + their open positions (fan-out fetch) |
| `usePolymarket` | PM market reads (`usePMMarkets`, `usePMMarket`) |
| `useTokenInfo(query)` | AVE-backed token data — risk score, price, mcap, holders, honeypot flags |
| `useAVEWallet` | Onchain wallet inspection (Moralis + AVE) — used by WalletDetail/Portfolio onchain views |
| `useAlerts`, `useDashboardStats`, `useLocalStorage`, `useSettings`, `useUserProfile`, `useWalletConnection`, `useWalletScan`, `useTransactionTracker`, `useTokenHistory`, `usePositions`, `useTrackedWallets` | Generic/UI utilities |

### `src/components/`

Notable non-`ui/` components:
- `ReasoningTraceCard.tsx` — expandable signal card surfacing reasoning trace + trace hash + Arc tx hash
- `BetConfirmModal.tsx` — bet flow with builder fee disclosure and signal context
- `BuilderFeeWidget.tsx` — public live earnings counter (aggregates `bet_history`)
- `SmartMoneyWallets.tsx` — curated onchain whale suggestions
- `BetConfirmModal`, `WalletConnectModal`, `TransactionHistory`, `GlobalSearch`, `QuickActionBar`, `PnLCard`, `PlatformStats`, `NavLink`
- `dashboard/`, `layout/AppLayout.tsx`, `ui/` (shadcn primitives)

### `supabase/`

- **Auto-generated client** at `src/integrations/supabase/client.ts` — **do not edit**.
- **Auth** in `src/contexts/AuthContext.tsx`. Strategy: Supabase (identity) + Circle Wallets (on-chain execution) — dual.
- **Edge functions** in `supabase/functions/`:
  - `signal-engine` — autonomous Claude-backed signal generator. Reads tracked wallets + PM markets, asks Claude for +EV signals, persists to `signals`. Stub mode when `ANTHROPIC_API_KEY` is unset.
  - `agent-chat` — conversational Claude endpoint with live context (recent signals + tracked wallets + bet history). Stub fallback when key unset.
  - `hyperliquid-fetch` — HL leaderboard + per-trader clearinghouse state + positions
  - `polymarket-traders` — PM active markets + top traders + user activity (via Gamma + data-api)
  - `ave-wallet`, `ave-token`, `ave-klines` — onchain data backbone (Moralis + AVE)
  - `wallet-scan` — Moralis wallet scanner
- **Migrations** in `supabase/migrations/`. New tables: `tracked_wallets.venue` enum extension, `signals`, `bet_history`.
- **pg_cron** must be configured separately to trigger `signal-engine` every 5 minutes (SQL snippet in `README.md`).

### `contracts/`

Foundry workspace. `LeaderBond.sol` is the slash-bond contract — USDC performance bond on tracked HL whales, slashable by oracle when leader's rank drops below threshold. Deploys to Arc. See `contracts/README.md`.

## Tailwind

- Dark mode via `class` strategy.
- Custom neon palette (`neon-pink/green/blue/purple/orange`) in `tailwind.config.ts` — use these tokens.
- Fonts: `font-heading` and `font-body` both Space Grotesk; `font-mono` is JetBrains Mono.
- Uses `tailwindcss-animate` plugin.

## Testing

- **Vitest**: jsdom environment, globals enabled. Setup `src/test/setup.ts` polyfills `matchMedia` and loads `@testing-library/jest-dom`. Test files match `src/**/*.{test,spec}.{ts,tsx}`.
- **Playwright**: `playwright-fixture.ts` re-exports from `lovable-agent-playwright-config/fixture`. Use that fixture for new E2E specs.

## Env vars

All client env vars must be `VITE_`-prefixed.

| Var | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | client | Supabase project URL (project ID `iikuixprsdulnrffedoi`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Supabase anon key |
| `VITE_CIRCLE_APP_ID` | client | Circle Developer Wallets SDK App ID |
| `VITE_POLYMARKET_BUILDER_ID` | client | Builder code attached to every Polymarket order |
| `VITE_ARC_CHAIN_ID` | client | Arc L1 chain ID (from ARC CLI) |
| `VITE_ARC_RPC` | client | Arc RPC URL (default: `https://arc-node.thecanteenapp.com/`) |
| `VITE_ARC_USDC_ADDRESS` | client | USDC ERC20 address on Arc |
| `ANTHROPIC_API_KEY` | Supabase secret | LLM for `signal-engine` (falls back to stub mode if unset) |

**Never commit `.env*`** — `.gitignore` excludes them. `.env.example` documents all keys.

## Stub-vs-live modes

The app is **demoable** without external setup: `signal-engine` returns deterministic stub signals when `ANTHROPIC_API_KEY` is unset, and `useExecutePMBet` records bets with status `STUB` when `VITE_POLYMARKET_BUILDER_ID` or `VITE_CIRCLE_APP_ID` is unset. The UI clearly flags stub state (amber badges, disclosure copy). To go live: set the env vars above + register builder code + deploy `LeaderBond`.

## Repo quirks

- **`.lovable/`** — build-time component tagging artifacts from `lovable-tagger`. Safe to ignore; don't manually edit.
- **`push.sh`** — custom one-commit-per-file auto-push script with filename-heuristic commit types. This is why earlier git history has many "auto update" commits. Don't reproduce this pattern for normal commits — use it only when you explicitly want that behavior.
- **`vercel.json`** and `vite.config.ts.timestamp-*.mjs` — the timestamp file is a Vite artifact; don't commit new ones (gitignored via `*.timestamp-*.mjs`).
- **Planning docs at root** — `PLANNING.md` (delivery log + remaining setup), `CONTEXT.md` (Agora hackathon context, authoritative), `AGENTS.md` (terse dev guide), `README.md` (user-facing).
