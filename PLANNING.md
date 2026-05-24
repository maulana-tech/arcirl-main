# Arcirl AI — Migration Delivery Log

> **Status:** All 6 phases complete. Build green. Demoable in stub mode; live mode requires the external setup checklist at the bottom.
> **Source target:** SoSoValue Buildathon (deprecated)
> **Current target:** [Agora Agents Hackathon](https://agora.thecanteenapp.com/) — Canteen / Circle / Arc
> **Positioning:** Smart Money Copy Agent — RFB 02 depth + RFB 06 breadth + RFB 01 signal-only

---

## 1. Product Thesis

Cross-venue copy-trading agent — one product, three sources of alpha:

```
                    ┌──────────────────────────┐
                    │   Smart Wallet Tracker   │  ← RFB 06 (spine)
                    │   HL + PM + Onchain      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Unified Signal Engine  │  ← Anthropic Claude
                    │   pg_cron · every 5 min  │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌────────────┐    ┌────────────┐    ┌────────────┐
       │  Perps     │    │ Prediction │    │  Onchain   │
       │  Signal    │    │ Market Bet │    │  Copy      │
       │  (RFB 01)  │    │  (RFB 02)  │    │  (RFB 06)  │
       │  view-only │    │ Polymarket │    │ Arc swaps  │
       │            │    │ builder    │    │ via Circle │
       │            │    │  codes     │    │ Contracts  │
       └────────────┘    └────────────┘    └────────────┘
                                 ▲
                          Settlement on Arc
                  Circle Wallets · Paymaster · Gateway
                          LeaderBond.sol
```

**Hook for judges:** Alpha traders migrate across venues (HL → PM → onchain). Existing copy-tools track only one venue. We unify them — and slash-bond the leader on Arc so users have skin in the game on the leader's performance, not just their own. Direct execution of Research Insights 02, 05, and 06 from [`CONTEXT.md`](./CONTEXT.md).

---

## 2. Judging Rubric Coverage

| Criteria | Weight | How we hit it |
|---|---|---|
| **Agentic Sophistication** | 30% | `signal-engine` edge function calls Anthropic Claude directly with structured-output schema. Triggered by Supabase `pg_cron` every 5 minutes — no user click required. Each signal carries a reasoning trace, a SHA-256 hash, and optional Arc tx hash (proof-of-decision). |
| **Traction** | 30% | Intercepts Polymarket's existing user pool. Every order via `useExecutePMBet` attaches `BUILDER_ID` — real USDC fees during the event window. `BuilderFeeWidget` displays live aggregate earnings; `bet_history` powers traction metrics. |
| **Circle Tool Usage** | 20% | Wallets (embedded signup hook in `src/lib/circle.ts`), Paymaster (gas-free betting), Gateway (cross-chain USDC funding), Contracts (`LeaderBond.sol`), USDC (native settlement on Arc). |
| **Innovation** | 20% | Cross-venue unification (Insight 05) + builder-code monetization (Insight 02) + slash-bonded leaderboard (Insight 06) — three CONTEXT.md insights executed end-to-end in one product. |

---

## 3. Migration Decisions (Locked)

| # | Question | Decision |
|---|---|---|
| 1 | Branding | "Arcirl AI" |
| 2 | SoSoValue/SoDEX cleanup scope | **Full rip** — no exceptions |
| 3 | Auth strategy | Supabase (identity) + Circle Wallets (on-chain execution) — dual |
| 4 | LLM key | Deferred; `signal-engine` ships with stub fallback until provisioned |

---

## 4. Delivery — Phases 0 through 6

### ✅ Phase 0 — Foundation

| Deliverable | Status |
|---|---|
| `PLANNING.md` (this document) | ✅ |
| `CLAUDE.md` rewritten | ✅ |
| `src/lib/arc.ts` (Arc L1 chain config) | ✅ |
| `src/lib/wagmiConfig.ts` extended with Arc | ✅ |
| `src/lib/circle.ts` (Wallets + Paymaster + Gateway wrappers) | ✅ |
| `src/lib/polymarket.ts` (CLOB client with builder code) | ✅ |
| `.env.example` | ✅ |

### ✅ Phase 1 — Smart Wallet Tracking (RFB 06 spine)

| Deliverable | Status |
|---|---|
| Migration `20260515095900_add_venue_to_tracked_wallets.sql` (`wallet_venue` enum, index) | ✅ |
| Edge function `hyperliquid-fetch` (leaderboard, clearinghouse, positions) | ✅ |
| Edge function `polymarket-traders` (markets, top-traders, user) | ✅ |
| `src/hooks/useSmartWallets.ts` (venue-aware CRUD + Top traders fetchers) | ✅ |
| `src/pages/SmartMoney.tsx` refactored — venue tabs + per-venue Top Traders | ✅ |
| `src/pages/WalletDetail.tsx` venue-aware (placeholder for HL/PM, full onchain) | ✅ |
| `src/components/SoSoValueWidget.tsx` deleted | ✅ |

### ✅ Phase 2 — Agent Engine

| Deliverable | Status |
|---|---|
| Migration `20260515100000_create_signals_table.sql` | ✅ |
| Edge function `signal-engine` (Claude-backed + stub fallback + SHA-256 trace hash) | ✅ |
| `src/hooks/useUnifiedSignals.ts` (Supabase Realtime subscribe + `triggerSignalEngine()`) | ✅ |
| `src/components/ReasoningTraceCard.tsx` | ✅ |
| `src/pages/Index.tsx` rewritten as autonomous signal feed | ✅ |
| Cascade-deleted: 13 components + 5 hooks + 2 edge functions (SoSoValue/SoDEX/legacy AI) | ✅ |

### ✅ Phase 3 — Polymarket Execution (RFB 02 depth)

| Deliverable | Status |
|---|---|
| Migration `20260515100100_create_bet_history.sql` | ✅ |
| `src/hooks/usePolymarket.ts` (`usePMMarkets`, `usePMMarket`) | ✅ |
| `src/hooks/useExecutePMBet.ts` (builder code attached every order, stub mode aware) | ✅ |
| `src/pages/PredictionMarkets.tsx` (market browser, filterable by signal coverage) | ✅ |
| `src/pages/MarketDetail.tsx` (orderbook + bet flow + reasoning overlay) | ✅ |
| `src/components/BetConfirmModal.tsx` (with builder fee disclosure + stub warning) | ✅ |
| `src/components/BuilderFeeWidget.tsx` (live earnings counter, Realtime subscribed) | ✅ |
| Routes/nav updated; `/trading` `/ai` `/analyzer` removed | ✅ |
| Deleted: `sosovalue.ts`, `sodex.ts`, `useSoDEXSwap`, `ExecuteTradeButton.tsx`, old `TradeConfirmModal.tsx` | ✅ |
| **Restored as Agora-native rebuilds** (later in session): `Trading.tsx` (whale-driven swap), `TokenAnalyzer.tsx` (signals + smart-money exposure), `AICommandCenter.tsx` (agent chat) — original SoSoValue/SoDEX-locked versions stay deleted | ✅ |

**Deferred** (needs external setup before live path is real, not blocked work):
- Circle Wallets embedded signup wiring in `Auth.tsx` (stub interface in place via `src/lib/circle.ts`)
- Paymaster + Gateway real calls (interfaces in place)

### ✅ Phase 4 — HL Perps Signal Layer (RFB 01 view-only)

| Deliverable | Status |
|---|---|
| `src/hooks/usePerpsIntel.ts` (top HL traders + parallel position fan-out) | ✅ |
| `src/pages/PerpsIntel.tsx` (whale positions, signal coverage badge) | ✅ |
| `/perps` route + nav item added | ✅ |

### ✅ Phase 5 — Slash-Bond Contract (Innovation close)

| Deliverable | Status |
|---|---|
| `contracts/foundry.toml` (Arc testnet rpc_endpoint) | ✅ |
| `contracts/src/LeaderBond.sol` (stake/withdraw/reportRank/slash) | ✅ |
| `contracts/src/IERC20.sol` | ✅ |
| `contracts/script/Deploy.s.sol` | ✅ |
| `contracts/README.md` | ✅ |

**Deferred** (needs Arc chain ID + USDC address + deployment):
- Edge function `oracle-leaderboard-rank` (pull rank, call `reportRank()`)
- UI: "Bond on this whale" button in `WalletDetail.tsx`
- `src/pages/MyBonds.tsx`

### ✅ Phase 7 — Restored Pages (Agora-native rebuilds)

The original SoSoValue/SoDEX-locked Trading, TokenAnalyzer, and AICommandCenter pages were deleted in Phase 3. The user asked them restored — rebuilt to integrate with the new architecture.

| Deliverable | Status |
|---|---|
| `supabase/functions/agent-chat` (Anthropic-backed chat with signals + wallets + bets context) | ✅ |
| `src/hooks/useAgentChat.ts` | ✅ |
| `src/hooks/useTokenInfo.ts` (AVE-token wrapper) | ✅ |
| `src/pages/AICommandCenter.tsx` (chat UI with live signal context strip + quick prompts) | ✅ |
| `src/pages/TokenAnalyzer.tsx` (token risk + agent signals + smart-money exposure cross-links) | ✅ |
| `src/pages/Trading.tsx` (whale-driven swap UI, Circle Wallet stub mode, signal-aware) | ✅ |
| `src/lib/circle.ts` extended with `quoteSwap` + `executeSwap` stubs | ✅ |
| Routes restored at `/trading`, `/analyzer`, `/ai`; nav items added | ✅ |

### ✅ Phase 6 — Polish & Submission Prep

| Deliverable | Status |
|---|---|
| Branding pass — 91 → 0 stale "VicSO/SoSoValue/SoDEX" string refs in `src/` (only inside `useTransactionTracker` source enum, now updated) | ✅ |
| `index.html` title + meta updated | ✅ |
| `public/manifest.json` updated | ✅ |
| `README.md` rewritten (product, stack, setup, deploy) | ✅ |
| `CLAUDE.md` updated to post-migration state | ✅ |
| Old historical docs (`API.md`, `BUILDATHON_*.md`) removed | ✅ |

**Pending** (user action — not code work):
- Demo video (2–3 min)
- Vercel production deploy
- Submission form
- Discord posts (Canteen, Arc Builder)
- Traction push to ≥10 unique users with completed bets

---

## 5. Bundle Footprint

| Stage | Main bundle | Δ |
|---|---|---|
| Pre-migration (Phase 0 baseline) | ~1265 KB | — |
| After Phase 2 cleanup | ~1180 KB | −85 KB |
| After Phase 3 cleanup | ~968 KB | −297 KB total |
| Final | ~983 KB | — |

---

## 6. Risk Register (Live)

| Risk | Mitigation |
|---|---|
| Anthropic API cost from 5-min cron | Cache wallet snapshot, only LLM-call when delta meaningful. Budget guard in edge function. |
| Polymarket builder code approval slow | Register Day 1. Fallback to stub-mode demo evidence. |
| Arc testnet unstable | Backup deploy to Sepolia / Base testnet. |
| Circle Wallets SDK churn | Pin version. Test integration during external-setup phase. |
| Traction tight | Demo + Discord push at every milestone, not just submission. |
| LLM key delay | `signal-engine` stub mode keeps product demoable. Swap stub → live with single env var. |

---

## 7. External Setup Checklist (Required for Live Mode)

These are not code work — they're accounts and config that gate the live path. The app demoes in stub mode without them.

- [ ] Circle Developer account → `VITE_CIRCLE_APP_ID` (https://developers.circle.com)
- [ ] Polymarket builder code registration → `VITE_POLYMARKET_BUILDER_ID` (https://docs.polymarket.com/trading/clients/builder)
- [ ] Install ARC CLI: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`
- [ ] From ARC CLI: `VITE_ARC_CHAIN_ID`, `VITE_ARC_RPC`, `VITE_ARC_USDC_ADDRESS`, faucet USDC
- [ ] Anthropic API key → `supabase secrets set ANTHROPIC_API_KEY=...`
- [ ] Apply Supabase migrations: `supabase db push`
- [ ] Deploy edge functions: `supabase functions deploy signal-engine hyperliquid-fetch polymarket-traders ave-wallet ave-token ave-klines wallet-scan`
- [ ] Configure pg_cron (SQL snippet in `README.md`)
- [ ] Deploy `LeaderBond.sol` (see `contracts/README.md`)
- [ ] Join Canteen Discord: https://discord.gg/TGnyfKh23V
- [ ] Join Arc Builder Discord: https://discord.com/invite/buildonarc (mention Canteen + Agora)

---

## 8. Submission

- **Form:** https://forms.gle/hFPM2t4Jt1zGfqzM7
- **Required:** product demo (live), public GitHub repo, traction metrics
