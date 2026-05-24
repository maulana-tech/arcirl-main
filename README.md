# Visco AI — Smart Money Copy Agent

> Autonomous cross-venue copy-trading agent — **Agora Agents Hackathon submission** (hosted by Canteen, powered by Circle & Arc).

![Status](https://img.shields.io/badge/Status-Active-22C55E?style=flat-square)
![Settlement](https://img.shields.io/badge/Settlement-Arc%20L1-6366F1?style=flat-square)
![Stablecoin](https://img.shields.io/badge/Stablecoin-USDC-2775CA?style=flat-square)

**Visco AI** tracks alpha traders across **Hyperliquid perps**, **Polymarket prediction markets**, and **onchain wallets**, generates +EV signals using an autonomous LLM reasoning loop (NVIDIA Llama 3.3 or Anthropic Claude Sonnet 4), and executes prediction-market bets via **Polymarket builder codes** — earning USDC fees on every fill while settling on Arc with sub-second finality.

## Why this product

Smart money migrates across venues — a whale who opens a leveraged BTC long on Hyperliquid often informs a Polymarket "BTC > $X by Y" bet. Existing copy-tools track only one venue. We unify them, and stake-bond the leader on Arc so users have skin in the game on the leader's performance, not just their own.

This is a direct execution of three [Research Insights](./CONTEXT.md) the Agora organizers published:

- **Insight 02** — builder codes as monetization
- **Insight 05** — HL whale cross-migration as a tradable signal
- **Insight 06** — slash-bonded leaderboard with on-chain performance bonds

## How it scores

| Criteria | Weight | How we hit it |
|---|---|---|
| **Agentic Sophistication** | 30% | NVIDIA Llama 3.3 / Anthropic Claude Sonnet 4 `signal-engine` edge function (real LLM signals) + `pg_cron` 5-minute autonomous trigger + SHA-256 reasoning-trace hash pinning |
| **Traction** | 30% | Intercepts Polymarket's existing user pool. Builder codes = real USDC fees during event window. Public `BuilderFeeWidget` showing live earnings. |
| **Circle Tool Usage** | 20% | W3S API integration: Developer-Controlled Wallets on ARC-TESTNET (entity secret + wallet set + RSA-OAEP ciphertext) via `circle-wallet` edge function. Paymaster (gas sponsorship quotes + sponsored tx). `LeaderBond` slash-bond [deployed](https://testnet.arcscan.app/address/0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea) on Arc with oracle rank reporter. USDC-native gas. |
| **Innovation** | 20% | Cross-venue unification + builder-code monetization + slash-bonded leader bonds — all hinted at by organizers, executed end-to-end |

## Product flow

```
                    ┌──────────────────────────┐
                    │   Smart Wallet Tracker   │
                    │   HL + PM + Onchain      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Signal Engine (LLM)    │
                    │   pg_cron · 5 min        │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌────────────┐    ┌────────────┐    ┌────────────┐
       │ Perps      │    │ Prediction │    │ Onchain    │
       │ Signal     │    │ Market Bet │    │ Copy       │
       │ (view-only)│    │ + builder  │    │ (Arc)      │
       └────────────┘    │   code     │    └────────────┘
                         └────────────┘
                                 ▲
                          Settlement on Arc
                  Circle Wallets · Paymaster · Gateway
                          LeaderBond.sol
```

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind + shadcn/ui + Radix |
| Web3 | wagmi v3 + viem + WalletConnect (Arc + EVM) |
| Identity + DB + Realtime | Supabase (auth, Postgres, pg_cron, edge functions) |
| LLM | NVIDIA (`meta/llama-3.3-70b-instruct`) or Anthropic (`claude-sonnet-4-20250514`) — auto-selected based on which API key is set |
| Execution | Polymarket CLOB (builder code) · Circle W3S API · Paymaster · Gateway |
| Data | Moralis (wallet scan) · AVE (token data) · Binance/CoinGecko/CryptoCompare (price oracles) |
| Contracts | Solidity 0.8.24 + Foundry, deployed to Arc |

## Edge Functions

All functions are live and connected to real APIs when keys are configured, with stub fallback when keys are missing:

| Function | Live API | Stub fallback |
|---|---|---|
| `signal-engine` | ✅ NVIDIA/Anthropic LLM | Deterministic stub signals |
| `agent-chat` | ✅ NVIDIA/Anthropic LLM | Stub replies |
| `circle-wallet` | ✅ Circle W3S (ARC-TESTNET) | Stub wallet |
| `oracle-leaderboard-rank` | ✅ Arc testnet (LeaderBond) | Stub response |
| `hyperliquid-fetch` | — | Seed trader data |
| `polymarket-traders` | ✅ Polymarket API | — |
| `wallet-scan` | ✅ Moralis | Stub whale data |
| `ave-token` | ✅ AVE API | Canned token data |
| `ave-wallet` | — | Stub whale data |
| `ave-klines` | — | Stub candles |

## Setup

### Prerequisites
- Node 18+, [Bun](https://bun.sh) (recommended)
- [Foundry](https://book.getfoundry.sh/) for the LeaderBond contract

### Install

```bash
bun install
cp .env.example .env
# Fill in env vars per the table below
```

### Required client env vars

```env
# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# Circle Developer Platform — https://console.circle.com
VITE_CIRCLE_APP_ID=b7308a79-fa57-5bed-8654-240b028aeeaf

# Polymarket builder code — https://docs.polymarket.com/trading/clients/builder
VITE_POLYMARKET_BUILDER_ID=0x7f178d13441d900ff266b7c9fe9a2d3fbf5c15f99ee433e8ef1adb00d308d937

# Arc L1
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_RPC=https://rpc.testnet.arc.network
VITE_ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=3f9229ce71cbb2c3fa97618d1add0643
```

### Required Supabase secrets

```bash
# LLM (at least one)
supabase secrets set NVIDIA_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=...

# Circle W3S API (Developer-Controlled Wallets)
supabase secrets set CIRCLE_API_KEY=...
supabase secrets set ENTITY_SECRET=...
supabase secrets set WALLET_SET_ID=...

# Data providers
supabase secrets set MORALIS_API_KEY=...
supabase secrets set AVE_API_KEY=...

# Arc onchain
supabase secrets set ORACLE_PRIVATE_KEY=...
supabase secrets set LEADER_BOND_ADDRESS=0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea
```

### Run

```bash
bun run dev            # localhost:8080
```

### Build

```bash
bun run build
```

### Deploy LeaderBond contract

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

**Deployed:** `0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea` on Arc testnet (chain 5042002).
See [`DEPLOY_PROOF.md`](./contracts/DEPLOY_PROOF.md) for the on-chain proof.

### Apply Supabase migrations & deploy edge functions

```bash
supabase db push

supabase functions deploy signal-engine --no-verify-jwt
supabase functions deploy agent-chat --no-verify-jwt
supabase functions deploy hyperliquid-fetch --no-verify-jwt
supabase functions deploy polymarket-traders --no-verify-jwt
supabase functions deploy circle-wallet --no-verify-jwt
supabase functions deploy oracle-leaderboard-rank --no-verify-jwt
supabase functions deploy wallet-scan --no-verify-jwt
supabase functions deploy ave-wallet --no-verify-jwt
supabase functions deploy ave-token --no-verify-jwt
supabase functions deploy ave-klines --no-verify-jwt
```

Set up the `pg_cron` job to trigger the signal engine every 5 minutes (run once in SQL editor):

```sql
SELECT cron.schedule(
  'signal-engine-tick',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/signal-engine',
    headers := jsonb_build_object('Content-Type', 'application/json')
  );$$
);
```

## Repo layout

```
src/
  lib/
    arc.ts              Arc L1 chain config
    circle.ts           Circle W3S API wrappers (create wallet, balance, Paymaster, swap, bridge)
    polymarket.ts       Polymarket CLOB client (with builder code)
    wagmiConfig.ts      wagmi v3 config (Arc + EVM)
  hooks/
    useSmartWallets     Multi-venue wallet tracking
    useUnifiedSignals   Signal feed (Supabase Realtime subscribe)
    usePolymarket       PM market reads
    useExecutePMBet     Bet execution with builder code attached
    useAgentChat        Conversational interface to agent-chat edge function
    usePerpsIntel       HL whale position fetcher
    useTokenInfo        AVE-backed token data (risk, mcap, honeypot flags)
  pages/
    Index.tsx           Autonomous signal feed + builder fees widget
    PredictionMarkets   Polymarket browser, filterable by signal coverage
    MarketDetail        Single market + agent reasoning + bet flow
    PerpsIntel          HL whale positions (leading indicator for PM)
    Trading             Whale-driven swap, Circle Wallet, signal-aware
    TokenAnalyzer       Per-token risk + agent signals + smart-money exposure
    AICommandCenter     Conversational chat to the agent (Anthropic-backed)
    SmartMoney          Venue-tabbed wallet tracker
    WalletDetail        Per-wallet activity (venue-aware)
  components/
    ReasoningTraceCard  Expandable signal card with reasoning trace + Arc hash
    BetConfirmModal     Bet flow with builder fee disclosure
    BuilderFeeWidget    Public live-earnings counter
supabase/
  functions/
    signal-engine       Autonomous LLM signal generator (pg_cron triggered)
    agent-chat          Conversational LLM endpoint with live signals/wallets/bets context
    hyperliquid-fetch   HL leaderboard + per-trader positions
    polymarket-traders  PM markets + top traders
    circle-wallet       Circle W3S API proxy (create wallet, balance, Paymaster, sponsored tx)
    oracle-leaderboard-rank  Reports leader rank to LeaderBond contract on Arc
    wallet-scan         Onchain wallet inspection via Moralis
    ave-wallet          AVE whale wallet data
    ave-token           AVE token data (price, mcap, risk score)
    ave-klines          AVE klines/candlestick data
contracts/
  src/LeaderBond.sol    USDC performance bond on tracked leaders, slashable by oracle
```

## Submission

- **Form**: https://forms.gle/hFPM2t4Jt1zGfqzM7
- **Migration plan**: [`PLANNING.md`](./PLANNING.md)
- **Hackathon context**: [`CONTEXT.md`](./CONTEXT.md)

## License

MIT
