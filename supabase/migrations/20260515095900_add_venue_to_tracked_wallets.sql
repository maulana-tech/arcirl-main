-- Agora migration Phase 1: multi-venue smart wallet tracking.
-- Adds `venue` so the same table backs Hyperliquid traders, Polymarket
-- traders, and onchain wallets without splitting tables.

DO $$ BEGIN
  CREATE TYPE wallet_venue AS ENUM ('hyperliquid', 'polymarket', 'onchain');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tracked_wallets
  ADD COLUMN IF NOT EXISTS venue wallet_venue NOT NULL DEFAULT 'onchain';

CREATE INDEX IF NOT EXISTS tracked_wallets_user_venue_idx
  ON public.tracked_wallets (user_id, venue);
