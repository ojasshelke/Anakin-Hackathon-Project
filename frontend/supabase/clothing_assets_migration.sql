ALTER TABLE clothing_assets
  ADD COLUMN IF NOT EXISTS meshy_task_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready';

CREATE INDEX IF NOT EXISTS idx_clothing_assets_meshy_task ON clothing_assets(meshy_task_id);
