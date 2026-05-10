CREATE TABLE IF NOT EXISTS tryon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_image_url TEXT,
  result_url TEXT NOT NULL,
  fit_label TEXT,
  recommended_size TEXT,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('queued','processing','ready','error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tryon_user ON tryon_results(user_id);
