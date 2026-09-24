-- Replace fixed pricing with pay-what-you-want ($2 minimum, enforced in the app)
-- and correct the "100%/50% to Ukraine" claims to accurately describe the split.
UPDATE public.games SET
  tagline = 'Six sectors of aerial combat. Pay what you want — a portion supports Ukraine relief.',
  description = 'A fast-paced browser shooter with six escalating levels of drone warfare. A portion of every payment supports Ukraine relief; the rest helps cover the cost of running this site.',
  long_description = E'Take command of your craft and battle through six uniquely themed sectors of escalating drone combat. Face off against progressively tougher enemy formations and boss encounters, each with distinct attack patterns.\n\nBuilt entirely in the browser — no downloads, no plugins. Responsive controls work on desktop, tablet, and mobile. Synthesized audio keeps the action immersive without any large audio files to load.\n\nUnlocking the full game is pay-what-you-want, $2 minimum. A portion of every payment supports Ukraine relief; the rest helps cover the cost of running this site.',
  price_cents = 200
WHERE slug = 'get-droned';
