-- Agora migration Phase 2: signals table.
-- Each row is one autonomous decision produced by the signal-engine edge
-- function. The reasoning_trace + trace_hash power the "AI agency proof"
-- story for judges (Research Insight 01 — trace as the product).

DO $$ BEGIN
  CREATE TYPE signal_venue AS ENUM ('hyperliquid', 'polymarket', 'onchain');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE signal_side AS ENUM ('BUY', 'SELL', 'HOLD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,

  venue signal_venue NOT NULL,
  market_id TEXT NOT NULL,
  market_label TEXT,
  side signal_side NOT NULL,
  size_suggested_usdc NUMERIC(20, 6),
  edge_estimate NUMERIC(6, 4),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),

  reasoning_trace TEXT NOT NULL,
  trace_hash TEXT,
  arc_tx_hash TEXT,

  source_wallets TEXT[] NOT NULL DEFAULT '{}',
  model TEXT,

  is_stub BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS signals_created_at_idx ON public.signals (created_at DESC);
CREATE INDEX IF NOT EXISTS signals_venue_idx ON public.signals (venue, created_at DESC);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Signals are globally visible (one feed for the whole app). Write access
-- is service-role only (signal-engine edge function bypasses RLS).
CREATE POLICY "Anyone can read signals"
  ON public.signals FOR SELECT
  TO authenticated, anon
  USING (true);
