# Arcirl AI — Setup Guide

## Quick Start Checklist

### Day 1 — External Account Setup (No Code, ~3 Hours)

---

### A1.1 — Circle Developer Account
1. Go to: https://console.circle.com/signup
2. Sign up / Log in
3. Navigate to **Wallets → User Controlled → Configurator**
4. Copy the **App ID** (for `VITE_CIRCLE_APP_ID`)
5. Create an **API Key** at **API & Client Keys** → Create a key → API Key
6. Docs: https://developers.circle.com/wallets

---

### A1.2 — Polymarket Builder Code (CRITICAL for fees)
1. Go to: https://docs.polymarket.com/trading/clients/builder
2. Apply for builder code (approval may take time — start early!)
3. Save your **Builder ID** (for `VITE_POLYMARKET_BUILDER_ID`)
4. This earns you fees on every bet placed through the app

---

### A1.3 — ARC CLI & Chain Setup
```bash
# Install ARC CLI
uv tool install git+https://github.com/the-canteen-dev/ARC-cli

# Run setup (creates .arc config)
arc setup

# Get chain details
arc info
```

Save:
- `VITE_ARC_CHAIN_ID` (chain ID)
- `VITE_ARC_RPC` (RPC URL, default: https://arc-node.thecanteenapp.com/)
- `VITE_ARC_USDC_ADDRESS` (USDC contract address)

Docs: https://arc-node.thecanteenapp.com/

---

### A1.4 — Anthropic API Key
1. Go to: https://console.anthropic.com
2. Navigate to API Keys
3. Create new key
4. Save for Supabase secret (not client-side)

---

### A1.5 — Discord Communities
1. Join Canteen Discord: https://discord.gg/TGnyfKh23V
2. Join Arc Builder Discord: https://discord.com/invite/buildonarc
   - Mention "Canteen + Agora" in onboarding
3. Introduce yourself — say what you're building

---

## Environment Variables Setup

Create a `.env` file in the project root:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=https://iikuixprsdulnrffedoi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here

# Circle (from A1.1)
VITE_CIRCLE_APP_ID=your_circle_app_id

# Polymarket Builder (from A1.2)
VITE_POLYMARKET_BUILDER_ID=your_builder_id

# Arc Chain (from A1.3)
VITE_ARC_CHAIN_ID=421614
VITE_ARC_RPC=https://arc-node.thecanteenapp.com/
VITE_ARC_USDC_ADDRESS=0xYourUSDCAddress

# Anthropic (from A1.4) — Set in Supabase dashboard, not client-side
# ANTHROPIC_API_KEY=your_key_here
```

---

## Supabase Secrets Setup

```bash
# Set Anthropic key in Supabase
supabase secrets set ANTHROPIC_API_KEY=your_key_here

# List secrets to verify
supabase secrets list
```

---

## Database Migrations

```bash
# Push migrations to Supabase
supabase db push

# Or via SQL in Supabase dashboard
# Apply migrations from supabase/migrations/
```

---

## Edge Functions Deploy

```bash
# Deploy all edge functions
supabase functions deploy signal-engine
supabase functions deploy agent-chat
supabase functions deploy hyperliquid-fetch
supabase functions deploy polymarket-traders
supabase functions deploy ave-wallet
supabase functions deploy ave-token
supabase functions deploy ave-klines
supabase functions deploy wallet-scan
```

---

## Smart Contract Deploy (Optional — Path B)

```bash
cd contracts

# Install foundry std
forge install foundry-rs/forge-std --no-commit

# Build contracts
forge build

# Deploy to Arc testnet
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

---

## pg_cron Setup (Optional)

```sql
-- Run in Supabase SQL editor
SELECT cron.schedule(
  'signal-engine-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:=current_setting('app.settings.signal_engine_url', true),
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.SUPABASE_SERVICE_ROLE_KEY', true)
    ),
    body:=jsonb_build_object('trigger', true)
  );
  $$
);
```

---

## Verify Setup

```bash
# Start dev server
bun run dev

# Check browser console for any errors
# Verify:
# - Signal engine produces signals (not STUB mode)
# - Polymarket markets load
# - Wallet connection works
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Circle App ID not found | Check https://console.circle.com → Wallets → User Controlled → Configurator |
| Polymarket builder pending | Start Day 1 — approval can take 1-3 days |
| Arc chain ID = 0 | Run `arc setup` again |
| Anthropic errors | Check API key in Supabase secrets |
| Build fails | Run `bun run build` to see errors |

---

## Need Help?

- Canteen Discord: https://discord.gg/TGnyfKh23V
- Arc Docs: https://docs.arc.network
- Circle Docs: https://developers.circle.com