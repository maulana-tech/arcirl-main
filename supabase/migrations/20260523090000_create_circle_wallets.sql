CREATE TABLE IF NOT EXISTS circle_wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  blockchain TEXT NOT NULL DEFAULT 'ARB-ETH',
  wallet_set_id TEXT,
  state TEXT NOT NULL DEFAULT 'LIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_wallets_user_id ON circle_wallets(user_id);

ALTER TABLE circle_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON circle_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets"
  ON circle_wallets FOR ALL
  USING (auth.role() = 'service_role');
