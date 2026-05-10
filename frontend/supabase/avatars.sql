CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  glb_url TEXT NOT NULL,
  face_texture_url TEXT,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('queued','processing','ready','error')),
  archetype_ids TEXT[] DEFAULT '{}',
  blend_weights FLOAT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_avatars_user ON avatars(user_id);
