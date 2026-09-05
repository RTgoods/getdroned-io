-- Player progress — tracks which sectors each paid player has completed
CREATE TABLE IF NOT EXISTS progress (
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id          UUID        NOT NULL REFERENCES games(id)      ON DELETE CASCADE,
  completed_sectors INTEGER[]  NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_progress"
  ON progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
