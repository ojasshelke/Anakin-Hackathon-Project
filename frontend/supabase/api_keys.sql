CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id TEXT NOT NULL,
  marketplace_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  call_count INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER DEFAULT 1000
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_marketplace ON api_keys(marketplace_id);
