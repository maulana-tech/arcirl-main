# Arcirl AI — Submission Plan

> **Current honest score** (audit di 2026-05-15): **~17/100**.
> **Goal:** ≥65/100 (Standout) atau ≥80/100 (Top 3 / $5k–$10k).
> **Hackathon window:** Agora — 2 weeks dari kickoff (deadline submit form TBD by user)

---

## 1. Score Math (per kriteria juri)

| Kriteria | Bobot | Skor sekarang | Skor target (Standout) | Skor target (Top 3) |
|---|---|---|---|---|
| Agentic Sophistication | 30% | 5 | 20 | 25 |
| Traction | 30% | 0 | 15 | 25 |
| Circle Tool Usage | 20% | 2 | 12 | 17 |
| Innovation | 20% | 10 | 14 | 17 |
| **Total** | 100% | **17** | **61** | **84** |

**Insight:**
- **Single biggest swing:** Traction (0 → 25 = +25 poin) — perlu real users + real bets
- **Easiest big swing:** Circle Tool Usage (2 → 17 = +15 poin) — install SDK real, ganti stub
- **Already strong:** Innovation — story sudah bagus, eksekusi tipis

---

## 2. Two Paths

### Path A — Aggressive (target Standout, $650–$750, ~5-7 hari)

Cut scope ke esensial. Hidup di stub mode untuk yang nggak critical.

**Kept:**
- Real Anthropic key → live signal engine
- Real Polymarket builder code → real fee accrual
- Public Vercel deploy
- Demo video + Discord traction push
- ≥5 real users place real bets via builder code

**Cut / left as stub:**
- Circle Wallets embedded signup (keep wagmi WalletConnect saja)
- Paymaster + Gateway (showcase via Code Connect saja)
- LeaderBond deployment (kontrak ada di repo, demo gak deploy live)
- pg_cron autonomous loop (manual trigger button cukup)

**Target score:** ~55-65/100

### Path B — Comprehensive (target Top 3, $5k–$10k, ~10-12 hari)

Penuh implementasi semua claim.

**Adds vs Path A:**
- Real Circle Wallets SDK embedded
- Paymaster gas sponsorship live
- Gateway cross-chain funding flow
- LeaderBond deployed + UI wired
- pg_cron autonomous trigger configured
- ≥10 unique users, ≥20 real bets, public BuilderFeeWidget showing live USDC accrual

**Target score:** ~75-85/100

---

## 3. Critical Path (Path A — aggressive)

```
Day 1     Day 2     Day 3     Day 4     Day 5     Day 6     Day 7
─────────────────────────────────────────────────────────────────
[A1 Registrasi external accounts] ──┐
                                     ├──> [A4 Wire Polymarket signing]
[A2 ANTHROPIC_API_KEY set] ──────────┤
                                     ├──> [A5 Deploy edge fn + migrations]
[A3 ARC CLI + chain ID]    ──────────┤
                                                                  │
                                                                  ▼
                                     [A6 Vercel deploy] ──> [A7 Demo video + Discord push]
                                                                                       │
                                                                                       ▼
                                                                                  [A8 Submit form]
```

### Day-by-day breakdown

#### Day 1 — User-blocking setup (paralel)
**User tasks (no code):**
- [ ] **A1.1** — Register Circle Developer account → grab App ID. ~30min. *Catatan: Path A cuma butuh Circle App ID untuk verify Wallets later; bisa skip kalau gak mau Paymaster*
- [ ] **A1.2** — Register Polymarket builder code at https://docs.polymarket.com/trading/clients/builder. ~1 jam (approval bisa lambat — start hari 1). **Critical untuk traction.**
- [ ] **A1.3** — Install ARC CLI: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`. Run it. Save: chain ID, RPC URL, USDC address. ~30min.
- [ ] **A1.4** — Get Anthropic API key (kalau belum). https://console.anthropic.com → API Keys. ~10min.
- [ ] **A1.5** — Buat akun Canteen Discord + Arc Builder Discord. Mention "Canteen + Agora" di Arc onboarding. ~10min.

**Saya bisa parallel kerjakan:**
- [ ] **A1.6** — Audit semua TODO di codebase, list hal yang block live mode
- [ ] **A1.7** — Tambahkan **manual trigger button** untuk signal engine di dashboard (kalau gak ada pg_cron, user trigger sendiri tiap 5 menit live demo)

#### Day 2 — Wiring real SDKs (saya kerjakan setelah A1 selesai)
- [ ] **A2.1** — `bun add @polymarket/clob-client` — atau pakai @web3-storage/eip712-signer untuk sign order
- [ ] **A2.2** — Replace stub `placeOrder()` di `src/lib/polymarket.ts` dengan real CLOB submit
- [ ] **A2.3** — Polymarket order signing flow:
  - Connect wallet (existing wagmi)
  - Sign EIP-712 order with builder address attached
  - Submit to CLOB endpoint
  - Poll status → update `bet_history`
- [ ] **A2.4** — Test flow end-to-end di Polymarket testnet (kalau tersedia) atau mainnet dengan $1 bet

#### Day 3 — Deploy infrastructure
- [ ] **A3.1** — `supabase secrets set ANTHROPIC_API_KEY=...`
- [ ] **A3.2** — `supabase db push` (apply migrations: tracked_wallets.venue, signals, bet_history)
- [ ] **A3.3** — `supabase functions deploy signal-engine agent-chat hyperliquid-fetch polymarket-traders ave-wallet ave-token ave-klines wallet-scan`
- [ ] **A3.4** — Verify signal engine produces real Claude signals (not stub) — call `triggerSignalEngine` manually
- [ ] **A3.5** — (Optional Path A) — pg_cron SQL snippet dari README

#### Day 4 — Vercel deploy + smoke test
- [ ] **A4.1** — `vercel --prod` dengan semua env vars
- [ ] **A4.2** — Smoke test live:
  - Signup flow
  - Connect wallet
  - Browse markets
  - Place $1 bet via builder code (real money, real fee)
  - Verify BuilderFeeWidget update
  - Verify signal feed live update
- [ ] **A4.3** — Fix bugs surfaced by live test

#### Day 5 — Demo content
- [ ] **A5.1** — Demo video 2-3 menit:
  - 0:00–0:30 — problem statement (cross-venue smart money migrasi)
  - 0:30–1:30 — product walkthrough (Feed → Markets → Bet via builder code)
  - 1:30–2:30 — AI Command Center → tanya agent, lihat reasoning
  - 2:30–3:00 — show LeaderBond.sol code + Innovation hook
- [ ] **A5.2** — Screenshot panel untuk submission form

#### Day 6-7 — Traction push
- [ ] **A6.1** — Post di Canteen Discord (#agora channel) — intro, link demo
- [ ] **A6.2** — Post di Arc Builder Discord — emphasize Arc-native settlement
- [ ] **A6.3** — Crypto Twitter thread dengan live BuilderFeeWidget screenshot
- [ ] **A6.4** — Personal outreach ke ≥10 friends/contacts untuk place $1-5 bet
- [ ] **A6.5** — Monitor `bet_history` table, screenshot earnings counter at submission time
- [ ] **A6.6** — Submit di https://forms.gle/hFPM2t4Jt1zGfqzM7 — include:
  - Demo URL
  - Repo URL (after final commit + push)
  - Demo video URL
  - Builder fee evidence
  - Team info

---

## 4. Critical Path (Path B — comprehensive, +5 hari)

Tambah ke Path A:

### Day 8-9 — Circle Wallets real integration
- [ ] **B1.1** — `bun add @circle-fin/w3s-pw-web-sdk` (atau equivalent)
- [ ] **B1.2** — Replace stubs di `src/lib/circle.ts` dengan real SDK calls:
  - `createEmbeddedWallet()` — wire ke Circle PIN-protected wallet creation
  - Replace WalletConnect button di header dengan Circle Wallet onboarding
  - Map Supabase `user.id` ↔ Circle wallet address
- [ ] **B1.3** — Test embedded signup flow: signup → wallet auto-created → place bet

### Day 9-10 — Paymaster + Gateway
- [ ] **B2.1** — Paymaster integration: every Polymarket order routed via Paymaster, gas paid in USDC
- [ ] **B2.2** — BetConfirmModal show real Paymaster quote
- [ ] **B2.3** — Gateway: user funds USDC dari chain manapun → unified Arc balance
- [ ] **B2.4** — Test flows

### Day 10-11 — LeaderBond deployment
- [ ] **B3.1** — `forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast`
- [ ] **B3.2** — Create `oracle-leaderboard-rank` edge function (pulls HL rank, calls `reportRank()`)
- [ ] **B3.3** — Wire "Bond on this whale" button di WalletDetail (HL venue)
- [ ] **B3.4** — Create `src/pages/MyBonds.tsx`
- [ ] **B3.5** — Test: stake $5 USDC, simulate rank drop, verify slash

### Day 11-12 — Polish + extra traction
- [ ] **B4.1** — pg_cron autonomous trigger configured live
- [ ] **B4.2** — Reasoning trace pinning ke Arc via real wagmi `writeContract` call
- [ ] **B4.3** — Target ≥20 unique users, ≥40 real bets
- [ ] **B4.4** — Second Twitter thread + email outreach

---

## 5. Risk Register

| Risk | Likely? | Mitigation |
|---|---|---|
| Polymarket builder code approval lambat | High (it's manual review) | Daftar Day 1 pagi. Kalau lambat, demo video tetap bisa pakai stub mode dengan disclaimer. |
| Circle Wallets SDK breaking / undocumented | Medium | Path A skip Circle Wallets — pakai wagmi only. Path B test integrasi pagi Day 8. |
| Arc testnet down / unstable | Medium | Backup deploy script untuk Sepolia atau Base testnet. Note ke juri kalau pivot. |
| Real bets fail di production | Medium | Test $1 bet dari own wallet Day 4 sebelum push traction |
| Zero real users hari 7 | High kalau push lemah | Personal network outreach Day 6. Insentif: "first 10 users dapat USDC tip kecil" |
| LLM budget overrun | Low | Cap `max_tokens` di edge function, throttle signal engine ke 1 panggilan tiap 5 menit, monitor Anthropic dashboard |
| Repo gak ke-push (git remote belum set) | Verify Day 1 — `git remote -v` |

---

## 6. Decision Tree — Mana Path yang Diambil?

**Pilih Path A kalau:**
- Solo developer atau tim kecil (≤2)
- < 7 hari sebelum deadline
- Budget Anthropic terbatas (<$50)
- Tolerable ke target Standout ($650–$750)
- Kamu nilai polish > breadth

**Pilih Path B kalau:**
- Tim ≥2 atau saya kerja full-time bantu
- ≥10 hari sebelum deadline
- Budget Anthropic OK ($100-200)
- Mau Top 3 ($5k+)
- Mau showcase semua Circle primitives untuk maksimalkan Circle Tool Usage 20%

---

## 7. Open Decisions

Sebelum jalanin plan, perlu jawaban kamu untuk:

1. **Path A atau Path B?** (atau hybrid — sebut spesifik mana yang dicut)
2. **Deadline submission kapan exact?** Saya butuh tahu ada berapa hari kerja
3. **Solo atau ada tim?** Kalau tim, siapa pegang external setup vs siapa pegang code review
4. **Berapa jam/hari yang bisa kamu commit?** (Saya bantu code, tapi A1.x butuh kamu manual)
5. **Anggaran Anthropic API**: $50, $100, $200? Saya bisa tune signal engine sesuai
6. **Mau real money taruh di Polymarket untuk test bet?** Min $1 — biar Day 4 smoke test beneran
7. **Sudah ada Vercel account?** Atau perlu dibuat
8. **Repo GitHub remote sudah set?** Saya nggak tahu — perlu `git remote -v`

---

## 8. What's Already Done (sebagai context — referensi `PLANNING.md`)

- ✅ Migration codebase SoSoValue → Agora (6 fase + 1 fase restore = 7 fase delivered)
- ✅ Semua architecture, tables, edge functions, components, pages
- ✅ Documentation update (CLAUDE, README, PLANNING, AGENTS)
- ✅ Build hijau, bundle 983 KB
- ✅ Contracts ditulis (Foundry workspace ready)

**Yang belum di-do (gating live mode):**
- ❌ External setup (Circle, Polymarket builder, ARC CLI, Anthropic key)
- ❌ Real Circle SDK install
- ❌ Real Polymarket order signing
- ❌ Edge function deploy
- ❌ Contract deploy
- ❌ Public deploy
- ❌ Demo video
- ❌ Traction push
- ❌ Submit form

---

## 9. Hari ini bisa langsung mulai apa?

Tanpa nunggu jawaban open decisions, saya bisa **mulai sekarang** beberapa hal yang independent:

- ✅ Add manual "Trigger Signal Engine" button (sudah ada di Index, verify works in stub mode)
- ✅ Audit codebase TODOs → consolidate ke single issue list di repo
- ✅ Improve stub mode UX — make sure semua stub disclosure jelas untuk demo
- ✅ Write `scripts/deploy-everything.sh` — single script yang jalanin all `supabase functions deploy` + `forge script` + `vercel deploy`
- ✅ Add seed data script — populate `tracked_wallets` dengan top 10 HL + top 10 PM addresses biar demo gak kosong

Itu semua bisa saya kerjakan sambil kamu jawab Open Decisions di atas.
