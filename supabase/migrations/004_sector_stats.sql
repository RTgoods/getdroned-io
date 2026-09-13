-- Per-sector stats and carry-over state stored on the progress row.
-- sector_stats: keyed by sector number, e.g. {"1": {"kills":45,"squadLost":0,"timeAlive":120,"moneyEnd":800,"belt":["drone","med"]}}
ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS sector_stats JSONB NOT NULL DEFAULT '{}';
