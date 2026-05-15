# Agora Agents Hackathon — CONTEXT

Hosted by **Canteen**, powered by **Circle** & **Arc**.

> Build AI agents that trade, invest, create, and interface with markets — settled on Arc, the stablecoin-native L1 from Circle.

---

## 🏛️ Overview

The agora was where Athens did its thinking out loud. Prices, opinions, and news converged in one square because that's where the people were. Markets are still doing the same job today; they are the social technology by which a civilization aggregates knowledge and decides what things are worth.

AI agents are the new citizens. They can monitor the agora around the clock, deliberate over thousands of signals, and act on the marginal one. This is the kind of continuous, comparative reasoning Aristotle described and that humans are too slow to perform across every market simultaneously. Treat the agora as substrate, treat your agent as a participant in it, and the right products start to suggest themselves.

**Arc** gives this substrate the right physics:
- **Sub-second deterministic finality** — trades settle instantly and irreversibly — no waiting, no reorgs.
- **~$0.01 transaction fees** paid in USDC (not volatile gas tokens) make high-frequency, low-margin strategies economical onchain for the first time.

Money-changers had their tables; agents have Arc.

---

## 🧑‍🤝‍🧑 Organizers

| Role | Entity | Description |
|------|--------|-------------|
| **Host** | **Canteen** | A research and technology firm operating at the intersection of crypto, AI, and payments. Hosts and curates the Agora Agents Hackathon. |
| **Platform** | **Circle** (NYSE: CRCL) | A global financial technology firm building the world's largest, most-widely used stablecoin network. Issuer of USDC and EURC. |
| **Settlement** | **Arc** | The purpose-built L1 blockchain from Circle. Serves as the Economic OS for the internet — where capital, humans, and machines coordinate. |

---

## 🚀 Getting Started (4 Steps)

### 01 — Join the Canteen Discord
- **Link:** https://discord.gg/TGnyfKh23V
- Drop in and say hello — tell them who you are and what you're building.
- The Canteen team is around, and so are the other Arc builders.

### 02 — Join the Arc Builder Discord
- **Link:** https://discord.com/invite/buildonarc
- Mention **Canteen + Agora** in the onboarding flow.
- If you get rejected or have trouble joining, ping `@anuxhya` in the Canteen Discord.

### 03 — Install the ARC CLI
```bash
uv tool install git+https://github.com/the-canteen-dev/ARC-cli
```
Includes RPC access to a Canteen-hosted Arc testnet, plus Arc repos and docs pre-bundled as agent context — so your coding agent can build against Arc out of the box.

**Docs:** https://arc-node.thecanteenapp.com/

### 04 — Submit Your Project
- **Form:** https://forms.gle/hFPM2t4Jt1zGfqzM7
- **You will need:**
  - A product demo (live working product)
  - A public link to your GitHub repo
  - Traction questions — e.g. how many users you have onboarded and what user problems you are building for

---

## 🏆 Awards ($50k Total)

### Grand Prizes — $40k TOTAL
| Place | Amount | Teams |
|-------|--------|-------|
| 1st | $10k | 1 team |
| 2nd | $7.5k × 2 = $15k total | 2 teams |
| 3rd | $5k × 3 = $15k total | 3 teams |

### Standout Teams — $7.5k TOTAL
- 10–12 teams demonstrating exceptional work
- Awarded in roughly equal shares (~$650–$750 per team)
- Not ranked within the cohort

### Feedback Incentives — $500 TOTAL
- For developers who provide the most useful product feedback on Circle's developer tooling
- Friction points, product improvements, and insights into developer experience

### Easter Eggs — $2k TOTAL
- Code-golf challenges, Discord puzzles, content creation challenges and assorted side quests
- Designed for explorers

---

## 🧱 The Stack

Circle's developer platform on Arc. Use what you need — these are the primitives best suited for agents that touch markets.

### Developer Docs (Start Here)
| Resource | Link |
|----------|------|
| Arc Developer Docs | https://docs.arc.network — Chain-level reference: network config, App Kit, sample apps, deployment |
| Circle Developer Docs | https://developers.circle.com — Product docs for CCTP, Gateway, Wallets, Contracts, Paymaster, and the stablecoins |

### Primitives

| Primitive | Description | Hackathon Use Case |
|-----------|-------------|-------------------|
| **CCTP** (Cross-Chain Transfer Protocol) | Move USDC between supported blockchains | Cross-chain arbitrage execution and multi-venue collateral rebalancing |
| **Gateway** | Enable a unified USDC balance across chains, with sub-500ms cross-chain transfers | Single-balance agents that act on any chain instantly — critical for arbitrage speed and multi-venue trading. Includes **Nanopayments** — gas-free USDC payments as small as $0.000001 via batched transactions, built for high-frequency agentic commerce |
| **Wallets** | Embed secure wallets in any app | Trading and betting accounts with automated key management for autonomous agents |
| **Contracts** | Build and manage smart contracts | Position management, liquidation protection, and hedging logic for onchain strategies |
| **Paymaster** | Allow transaction fees in USDC | User-facing agent UX where every cost is denominated in USDC — no volatile gas tokens to source or budget around |
| **USYC** | A tokenized money market fund | Park idle capital in yield between trades, or use as risk-off allocation during high-volatility regimes |
| **USDC & EURC** | The leading digital dollar and digital euro | Native settlement on Arc, multi-currency markets, and FX-aware strategies that price events in the buyer's home currency |
| **App Kit** | Drop-in components for common flows | **Bridge** — move USDC across blockchains in a few lines of code. **Swap** — exchange tokens on the same chain via a simple API. **Send** — transfer tokens between wallets in a single call. **Unified Balance** — combine USDC across chains into one balance |

### Reference Implementations (Arc Sample Apps)

Open-source starting points for building on Arc with Circle developer tools — fork them, remix them, or use as scaffolding for your submission.

| Sample App | Description |
|------------|-------------|
| **Arc commerce** | USDC payments for credit purchases |
| **Arc multi-chain wallet** | Unified USDC balance and crosschain transfers |
| **Arc escrow** | AI-powered work validation and USDC settlement |
| **Arc fintech** | Multichain treasury with crosschain capital movement |
| **Arc p2p payments** | Seamless, gasless peer-to-peer payments on Arc |

---

## 📋 RFBs — Requests for Builders

Six open problems worth solving in the spirit of the agora. These aren't tracks — if one excites you, treat it as extra validation to dive in. Build something adjacent, or surprise us.

### RFB 01 — Perpetual Futures Trading Agent
24/7 monitoring, split-second leverage decisions, autonomous liquidation protection.

### RFB 02 — Prediction Market Trader Intelligence
Find +EV bets across noisy news, data, and sentiment. Size positions properly.

### RFB 03 — Prediction Market Verticals
Geopolitics, macro, institutional, private. The markets that should exist but don't.

### RFB 04 — Adaptive Portfolio Manager
Constant rebalancing, regime detection, tax optimization. Tedious for humans; cross-chain.

### RFB 05 — Cross-Platform Arbitrage Agent
Discrepancies vanish in seconds. Detect, route, execute — survive slippage.

### RFB 06 — Social Trading Intelligence
Most copy-traders mirror leaders blindly. AI selects, weights, and monitors.

---

## 🔬 Research Insights

Research that points directly to buildable products. Hacks, hooks, and angles where Arc's ~$0.01 fees and sub-second finality unlock something that wasn't economical before.

### 01 — Trading-R1: Reasoning traces as the product
**Wang et al., 2025 · Tauric Research**

Trading-R1 is a large-scale financial reasoning model mirroring the DeepSeek-R1 design — its value is the reasoning trace, not the trade, which makes the trace itself the product. With Arc's ~$0.01 fees, the full reasoning trace can be hashed and pinned (trace to IPFS / Irys, hash on Arc) without eroding PnL. That unlocks a new market type: bets on which reasoning patterns converge to profit, with TradingAgents v0.2.4's structured outputs (Trader / Research Manager / Portfolio Manager all emit JSON-schema'd reasoning) as the machine-readable substrate.

**Paper:** https://arxiv.org/abs/2509.11420
**RFB Tie:** RFB 06 — Social Trading Intelligence. Copy-trading has always been a proxy for intelligence and access. What people actually want to copy is how someone thinks — which traces finally make legible and Arc finally makes affordable to publish.

### 02 — Builder codes as every LLM agent's monetization layer
**Polymarket V2 · Builder spec**

Builder codes let an agent that recommends a bet take a cut of every fill that originates from its recommendation — no custody, no token, just on-chain attribution. Every trading agent today is unmonetized: the framework gives picks, the user trades them somewhere else. The hack: a thin "agent-as-builder" wrapper that registers any agent framework as a Polymarket V2 builder, exposes its structured outputs as a signed feed, and earns USDC builder fees per fill — Arc's ~$0.01 fees make per-pick economics work at retail size.

**Docs:** https://docs.polymarket.com/trading/clients/builder
**RFB Tie:** RFB 02 — Prediction Market Trader Intelligence. This is the actual answer to "how does InsightAgent make money?" — not subscription, builder fees.

### 03 — Freqtrade's bot blacklist as a tradable oracle
**iterativv / NostalgiaForInfinity**

Buried in the metadata of NostalgiaForInfinity — a strategy for Freqtrade — is a finding most people miss: many commits are iterativv adding meme-coins to the blacklist (BLUM, MONPRO, UXLINK, IZI, YZY, BSY, WAT, RAIN). This is (likely) a single human doing real-time, high-frequency rugpull detection with a public commit log, currently free. The hack: parse the NFI commit feed, mint each blacklist addition as a signed Arc event ("iterativv-blacklisted-X at block N"), and seed a prediction market vertical of "will [coin] lose >50% in 7 days". Sub-second finality matters because the blacklist signal front-runs the rug — the market needs to open in the same block iterativv pushes.

**Repo:** https://github.com/iterativv/NostalgiaForInfinity
**RFB Tie:** RFB 03 — Prediction Market Verticals. A vertical of rugpull markets where the resolution signal is a maintainer with provable track record, not an oracle committee.

### 04 — Translation as a source of alpha
**Wang et al., 2025 · TradingAgents**

TradingAgents-CN, AlpacaTradingAgent, and the original TauricResearch/TradingAgents library are all reskins of the same architecture; what differs is which data sources their locale's investors trust. The framework is interchangeable; the translation layer is the moat. Polymarket only operates in English-language US events because translating Mandarin macro news into a well-formed prediction market question is the bottleneck. The hack: a market where agents bid in USDC for the right to translate a non-English news event into a Polymarket-shaped question, with builder fees flowing back to the translator on every fill that originates from their question.

**Paper:** https://arxiv.org/pdf/2412.20138
**RFB Tie:** RFB 03 — Prediction Market Verticals. The actual mechanism for emerging-markets prediction verticals — pay translators per-fill, not per-translation.

### 05 — Hyperliquid whale cross-migration index token
**Hyperliquid · historical data**

Top HL whales migrate across forks (Aster, Polynomial, etc.). The hack: an Arc-native ERC-20 holding USDC that auto-rebalances exposure across HL forks based on top-trader migration. Each rebalance is a Gateway cross-chain move; weekly rebalances cost cents on Arc rather than dollars elsewhere. The rebalance signal is the research — "where smart money is currently trading." Buyers hold one token; the underlying is a live migration-tracking index.

**Docs:** https://hyperliquid.gitbook.io/hyperliquid-docs/historical-data
**RFB Tie:** RFB 04 — Adaptive Portfolio Manager and RFB 06 — Social Trading Intelligence. A portfolio product whose allocation rule is itself a copy-trading insight.

### 06 — Slash-bonded leaderboard copy-trading
**Nansen · HL leaderboard API**

HL leaderboard rank may not persist out-of-sample. The hack: a USDC performance bond on Arc for a given whale that users can stake alongside. A smart contract reads leaderboard rank via oracle; if the leader falls below a defined threshold, the bond slashes proportionally and the slash settles in under a second. The research output (the empirical decay function) becomes the smart-contract slash schedule directly. Arc's cheap fees mean this works at retail follower size, whereas on other chains the gas would erode the bond.

**Docs:** https://docs.nansen.ai/api/hyperliquid/hyperliquid-leaderboard
**RFB Tie:** RFB 06 — Social Trading Intelligence. Copy-trading with skin in the game on the leader, not just the follower.

---

## ⚖️ Judging Criteria

We weigh agency and traction equally. Real users matter, real decisions matter, and we want to see both. These weightings are recommendations — judges have the final say, and the best projects tend to break the rules.

| Criteria | Weight | Focus |
|----------|--------|-------|
| **Agentic Sophistication** | 30% | How much does the AI actually decide vs just automate? Full autonomy beats meaningful agency beats AI-flavored automation |
| **Traction** | 30% | Real users, real transactions, real volume during the event window. Great founders ship and get users in two weeks |
| **Circle Tool Usage** | 20% | Creative and effective use of the Circle developer platform. Wallets, CCTP, Gateway, App Kit, Contracts, USYC, USDC |
| **Innovation** | 20% | Novel approaches, emergent behavior, research insight. New territory beats polished re-runs |

---

## 📝 Voices from the Agora

> *"All things that are exchanged must be somehow comparable."*
> — **Aristotle**, Nicomachean Ethics · Book V (on price discovery)

> *"Is not he a benefactor who reduces the inequalities and disproportions of goods to equality and proportion?"*
> — **Plato**, Laws · Book XI (on arbitrage as public good)

> *"The agora is, as it were, the heart of the city."*
> — **Aristotle**, Politics · Book VII (on the marketplace as substrate)

> *"All things are an exchange for fire, and fire for all things — even as wares for gold and gold for wares."*
> — **Heraclitus**, Fragment 90 · c. 500 BCE (The School of Athens — Raphael, 1509–1511)

---

## 🎯 Apply

**Build agents that move markets.**

Two weeks, six RFBs, real users. Real settlement on Arc.

**Website:** https://agora.thecanteenapp.com/

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| Canteen Discord | https://discord.gg/TGnyfKh23V |
| Arc Builder Discord | https://discord.com/invite/buildonarc |
| ARC CLI Repo | https://github.com/the-canteen-dev/ARC-cli |
| Arc Node Docs | https://arc-node.thecanteenapp.com/ |
| Arc Developer Docs | https://docs.arc.network |
| Circle Developer Docs | https://developers.circle.com |
| Submission Form | https://forms.gle/hFPM2t4Jt1zGfqzM7 |
| Polymarket Builder Docs | https://docs.polymarket.com/trading/clients/builder |
| Agora Website | https://agora.thecanteenapp.com/ |
