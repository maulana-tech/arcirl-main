-- Agora migration Phase 3: bet history.
-- Every Polymarket bet placed through this app is logged here. Powers the
-- public BuilderFeeWidget (live earnings counter) and the traction metrics
-- ("X bets via builder code") for the demo submission.

DO $$ BEGIN
  CREATE TYPE bet_status AS ENUM ('PENDING', 'PLACED', 'FILLED', 'PARTIAL', 'CANCELLED', 'REJECTED', 'STUB');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,

  market_id TEXT NOT NULL,
  market_question TEXT,
  outcome_id TEXT NOT NULL,
  outcome_label TEXT,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price NUMERIC(8, 6) NOT NULL,
  size_usdc NUMERIC(20, 6) NOT NULL,

  builder_id TEXT NOT NULL,
  builder_fee_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,

  status bet_status NOT NULL DEFAULT 'PENDING',
  order_id TEXT,
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS bet_history_user_idx ON public.bet_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bet_history_created_idx ON public.bet_history (created_at DESC);
CREATE INDEX IF NOT EXISTS bet_history_builder_idx ON public.bet_history (builder_id, created_at DESC);

ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

-- Public aggregates (for BuilderFeeWidget). Anyone can read summary stats.
CREATE POLICY "Anyone can read bet history"
  ON public.bet_history FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only the owner can insert/update their bets.
CREATE POLICY "Users insert own bets"
  ON public.bet_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own bets"
  ON public.bet_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
