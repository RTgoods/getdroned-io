-- ──────────────────────────────────────────────────────────────────────────────
-- AI Games — initial schema
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ──────────────────────────────────────────────────────────────────────────────

-- Games catalog
CREATE TABLE IF NOT EXISTS games (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        UNIQUE NOT NULL,
  title            TEXT        NOT NULL,
  tagline          TEXT,
  description      TEXT,
  long_description TEXT,
  price_cents      INTEGER     NOT NULL DEFAULT 0,
  stripe_price_id  TEXT,
  stripe_product_id TEXT,
  thumbnail_url    TEXT,
  screenshots      JSONB       NOT NULL DEFAULT '[]',
  trailer_url      TEXT,
  play_url         TEXT,
  tags             TEXT[]      NOT NULL DEFAULT '{}',
  genre            TEXT,
  is_published     BOOLEAN     NOT NULL DEFAULT false,
  is_featured      BOOLEAN     NOT NULL DEFAULT false,
  release_date     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase records (written by Stripe webhook via service role)
CREATE TABLE IF NOT EXISTS purchases (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id                  UUID        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  stripe_session_id        TEXT        UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid_cents        INTEGER,
  status                   TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

-- ── Row-level security ────────────────────────────────────────────────────────

ALTER TABLE games     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can read published games
CREATE POLICY "read_published_games"
  ON games FOR SELECT
  USING (is_published = true);

-- Users manage their own profile
CREATE POLICY "read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users read their own purchases
CREATE POLICY "read_own_purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Seed data ─────────────────────────────────────────────────────────────────
-- "Get Droned" — first game in the store.
-- Set play_url to '/get-droned/index.html' once you copy the game files to public/get-droned/
-- (see SETUP.md for details).

INSERT INTO games (
  slug, title, tagline, description, long_description,
  price_cents, tags, genre,
  is_published, is_featured,
  play_url, release_date
)
VALUES (
  'get-droned',
  'Get Droned',
  'Six sectors of aerial combat. 50% of every sale goes to Ukraine.',
  'A fast-paced browser shooter with six escalating levels of drone warfare. Half of every purchase is donated to Ukraine relief.',
  E'Take command of your craft and battle through six uniquely themed sectors of escalating drone combat. Face off against progressively tougher enemy formations and boss encounters, each with distinct attack patterns.\n\nBuilt entirely in the browser — no downloads, no plugins. Responsive controls work on desktop, tablet, and mobile. Synthesized audio keeps the action immersive without any large audio files to load.\n\n50% of every purchase is donated directly to Ukraine humanitarian relief.',
  1999,
  ARRAY['Action', 'Shooter', 'Browser'],
  'Action',
  true,
  true,
  '/get-droned/index.html',
  CURRENT_DATE
)
ON CONFLICT (slug) DO NOTHING;
