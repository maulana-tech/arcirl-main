CREATE TABLE IF NOT EXISTS rank_reports (
  id BIGSERIAL PRIMARY KEY,
  leader TEXT NOT NULL,
  rank INTEGER NOT NULL,
  threshold INTEGER,
  tx_hash TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'arc_testnet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rank_reports_leader ON rank_reports(leader);

ALTER TABLE rank_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rank reports"
  ON rank_reports FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert rank reports"
  ON rank_reports FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
