/**
 * Static game catalog — used as fallback when Supabase isn't connected,
 * and as the source of truth for the SQL seed.
 * Once Supabase is wired up, data comes from the DB; this file is ignored.
 */
import type { Game } from '@/types/database'

export const STATIC_GAMES: Game[] = [
  {
    id: 'static-get-droned',
    slug: 'get-droned',
    title: 'Get Droned',
    tagline: 'Six sectors of aerial combat. Pay what you want — a portion supports Ukraine relief.',
    description:
      'A fast-paced browser shooter with six escalating levels of drone warfare. A portion of every payment supports Ukraine relief; the rest helps cover the cost of running this site.',
    long_description:
      'Take command of your craft and battle through six uniquely themed sectors of escalating drone combat. Face off against progressively tougher enemy formations and boss encounters, each with distinct attack patterns.\n\nBuilt entirely in the browser — no downloads, no plugins. Responsive controls work on desktop, tablet, and mobile. Synthesized audio keeps the action immersive without any large audio files to load.\n\nUnlocking the full game is pay-what-you-want, $2 minimum. A portion of every payment supports Ukraine relief; the rest helps cover the cost of running this site.',
    price_cents: 200,
    stripe_price_id: null,
    stripe_product_id: null,
    thumbnail_url: null,
    screenshots: [],
    trailer_url: null,
    play_url: '/get-droned/index.html',
    tags: ['Action', 'Shooter', 'Browser'],
    genre: 'Action',
    is_published: true,
    is_featured: true,
    rec_enabled: false,
    release_date: '2026-09-03',
    created_at: '2026-09-03T00:00:00.000Z',
    updated_at: '2026-09-03T00:00:00.000Z',
  },
]
