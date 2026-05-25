# Arcirl AI — Video Demo Script (3 minutes)

**Target:** Agora Agents Hackathon submission  
**Focus:** Agentic Sophistication + Traction + Circle/Arc Integration + Innovation

---

## 0:00–0:35 | HOOK + PROBLEM (35 sec)

**[SCREEN: Split-screen — Hyperliquid whale position + related Polymarket bet]**

> "Smart money doesn't stay in one venue. A whale opens a 10x BTC long on Hyperliquid... and three hours later, places a six-figure bet on Polymarket for 'BTC hits $100K by June.'"

**[SCREEN: Show existing copy-trading tools — only track ONE venue]**

> "Existing copy-trading tools are siloed. They track EITHER Hyperliquid perps, OR Polymarket predictions, OR onchain wallets. Never all three. You miss the full signal."

**[SCREEN: Arcirl AI logo + tagline]**

> "Arcirl AI unifies all three. One autonomous agent. Cross-venue intelligence. Settled on Arc."

---

## 0:35–1:10 | AUTONOMOUS SIGNAL ENGINE (35 sec)

**[SCREEN: Homepage — Signal Feed with Realtime updates, show 5+ signals]**

> "This is the signal feed. It updates in real-time via Supabase Realtime. But here's the key: **I didn't trigger this**. The agent did."

**[SCREEN: Point to timestamp "2 min ago" on top signal]**

> "Every 5 minutes, a Supabase pg_cron job triggers an edge function. It calls Anthropic Claude Sonnet 4, feeds it live data from Hyperliquid whales, Polymarket top traders, and onchain wallets... and the LLM decides which bets have positive expected value."

**[SCREEN: Click into a signal → expand reasoning trace]**

> "Here's the reasoning trace. Multi-paragraph analysis. Why this bet is +EV. Which wallets triggered it. And this—"

**[SCREEN: Point to SHA-256 hash + "View on Arc" link]**

> "—is the SHA-256 hash of the trace, optionally pinned to Arc for proof-of-decision. The reasoning IS the product."

**[ACTION: Collapse trace, scroll to next signal]**

---

## 1:10–1:50 | EXECUTION + BUILDER CODES (40 sec)

**[SCREEN: Click "Act on this signal" → navigate to Market Detail page]**

> "When I act on a signal, the app routes me to the Polymarket market. Here's the current price: 16 cents for 'Yes'. Agent recommended 'BUY' at 55% confidence."

**[SCREEN: Click "Bet Yes" → show BetConfirmModal]**

> "When I place this bet, Arcirl attaches a Polymarket V2 builder code to the order. That's Research Insight 02 from the hackathon brief: builder codes as the monetization layer."

**[SCREEN: Point to builder code disclosure in modal]**

> "Builder fees are paid in USDC by my counterparty—not me. Zero extra cost. Every fill earns revenue for the agent."

**[SCREEN: Close modal, navigate to homepage]**

> "And this—"

**[SCREEN: Point to BuilderFeeWidget at top of homepage showing live earnings]**

> "—is the live earnings counter. Public. Transparent. Real USDC during the event window. That's traction."

**[ACTION: Quick scroll to show 3-5 bet_history entries if visible, or just leave the widget visible]**

---

## 1:50–2:25 | CROSS-VENUE INTELLIGENCE (35 sec)

**[SCREEN: Navigate to /smart-money → show venue tabs: HL / PM / Onchain]**

> "This is where the cross-venue magic happens. Three tabs: Hyperliquid, Polymarket, Onchain."

**[SCREEN: Click Hyperliquid tab → show tracked whales list]**

> "I'm tracking top Hyperliquid perps traders. Click one—"

**[SCREEN: Click a whale → show WalletDetail page with positions]**

> "—and I see their open positions. The agent uses this as a leading indicator for Polymarket bets."

**[SCREEN: Navigate to /perps]**

> "The Perps Intel page shows the full leaderboard. Signal coverage badges tell me which whales are actively generating agent signals."

**[SCREEN: Navigate back to /smart-money → click Polymarket tab briefly]**

> "Same for Polymarket top traders. And onchain wallets via Moralis. One agent. Three venues."

**[ACTION: Quick pan, don't linger]**

---

## 2:25–2:50 | CIRCLE + ARC INTEGRATION (25 sec)

**[SCREEN: Navigate to homepage, point to BuilderFeeWidget again]**

> "All settlements happen on Arc. Sub-second finality. Fees paid in USDC, not volatile gas tokens."

**[SCREEN: Open browser tab → paste Arc testnet block explorer link]**
**URL: https://testnet.arcscan.app/address/0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea**

> "This is the LeaderBond contract I deployed to Arc testnet. It's a USDC performance bond on tracked Hyperliquid whales. If their rank drops, the bond slashes. That's Research Insight 06: slash-bonded copy-trading."

**[SCREEN: Show contract address 0x6d4d... visible on screen]**

> "Circle's Developer-Controlled Wallets, Paymaster for gas sponsorship, and Gateway for cross-chain USDC—this is the full Circle stack in production."

**[ACTION: Close tab, return to Arcirl app]**

---

## 2:50–3:00 | CLOSE (10 sec)

**[SCREEN: Homepage — signal feed visible with multiple signals]**

> "Three Research Insights from the hackathon brief. One product. Autonomous. Cross-venue. Monetized via builder codes. Settled on Arc."

**[SCREEN: Fade to Arcirl logo + URLs]**

**TEXT OVERLAY:**
```
Arcirl AI — Smart Money Copy Agent

🔗 https://arcirl-main.vercel.app
📂 https://github.com/maulana-tech/arcirl-main
🏛️ Agora Agents Hackathon — Canteen × Circle × Arc
```

> "Arcirl AI. Built for Agora."

**[END]**

---

## PRODUCTION NOTES

### Before Recording
1. **Clear browser cache** — fresh load so animations are smooth
2. **Seed fresh signals** — run `curl -X POST signal-engine` to get 5+ recent signals
3. **Open tabs in order:**
   - Tab 1: https://arcirl-main.vercel.app/ (homepage)
   - Tab 2: https://testnet.arcscan.app/address/0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea (contract)
4. **Test all nav flows once** before final recording
5. **Enable stub mode or live mode** — decide which. If stub, make sure "STUB" badges are visible and you acknowledge it in narration ("This is demo mode, builder code not attached yet—but the flow is identical").

### During Recording
- **Pace:** Speak clearly but not rushed. 3 minutes is tight but doable.
- **Cursor:** Use a screen recording tool that highlights mouse clicks (e.g., Loom, ScreenFlow, OBS with click highlighter).
- **No dead air:** If a page loads slowly, narrate what's happening ("The agent is querying the edge function...").
- **Zoom UI elements** — when pointing to SHA-256 hash or builder code, briefly zoom in so it's legible at 1080p.

### Screen Recording Settings
- **Resolution:** 1920×1080 or 2560×1440 (Loom/YouTube will downscale)
- **Frame rate:** 30 FPS minimum
- **Audio:** Use external mic if possible (AirPods Pro quality is acceptable)
- **Captions:** Add subtitles via YouTube auto-caption + manual cleanup if audio has accent/background noise

### If Deployment is in Stub Mode
Add this line at **1:35** (during bet modal):

> "We're in demo mode right now—no real USDC is moving—but the full execution path is wired. Set two env vars, and this becomes a live builder earning fees on every Polymarket fill."

---

## BACKUP: 2-MINUTE VERSION (if 3 min is too tight)

Cut these sections:
- ❌ Split-screen intro (go straight to problem statement)
- ❌ WalletDetail deep dive (just show Smart Money tabs, no drill-down)
- ❌ Contract deployment proof (mention it verbally, skip the tab switch)

This gets you to **1:55–2:05** total.

---

## POST-PRODUCTION CHECKLIST

- [ ] Add text overlays for URLs (0:05 logo card + 2:55 closing card)
- [ ] Add captions/subtitles (YouTube auto + manual cleanup)
- [ ] Export at 1080p, H.264, <50 MB if possible (Loom auto-handles this)
- [ ] Test playback at 1.25x speed (judges may watch faster) — make sure narration is still clear
- [ ] Upload to YouTube unlisted, paste link in submission form
- [ ] Optional: 15-second teaser for Twitter/Discord (just the hook + "Full demo in bio")

---

## ALTERNATIVE: TALKING-HEAD VERSION

If you want to appear on camera:
- **Picture-in-picture** — small webcam feed in bottom-right corner
- **Keep face visible but small** — screen is the hero
- **Eye contact with camera** during hook (0:00–0:10) and close (2:50–3:00)
- **Look at screen** during walkthrough (0:35–2:45) — it's natural

**Recommended:** Screen-only recording is safer (no awkward pauses, can re-record sections independently).

---

## FINAL TIP: THE ONE-TAKE TRICK

Record the **audio narration first** as a single 3-minute take (reading this script out loud, timing yourself with a stopwatch). Then record the **screen capture** separately, matching your pre-recorded narration. Sync them in post (iMovie, DaVinci Resolve, or even Loom's editor).

This way:
- Audio is clean (no mouse-click noise, no "umm" while waiting for page loads)
- Screen capture can be redone if a page glitches
- Total production time: <1 hour instead of 20 takes

Good luck! 🎬
