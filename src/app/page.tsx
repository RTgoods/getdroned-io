import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { STATIC_GAMES } from '@/lib/games-catalog'
import { GamePageClient } from '@/components/GamePageClient'
import type { Game } from '@/types/database'

// Cache game metadata for 60 s — it almost never changes
const getGame = unstable_cache(
  async (slug: string) => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    return (data as Game | null) ?? STATIC_GAMES.find((g) => g.slug === slug)!
  },
  ['game-meta'],
  { revalidate: 60 }
)

export default async function HomePage() {
  const supabase = await createClient()

  // Game metadata — cached across requests
  const game = await getGame('get-droned')

  // Auth — per-request (can't cache cookies)
  const { data: { user } } = await supabase.auth.getUser()

  let hasPurchased = false
  if (user && game.price_cents > 0) {
    const { data: p } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', game.id)
      .eq('status', 'completed')
      .maybeSingle()
    hasPurchased = !!p
  }

  return <GamePageClient game={game} user={user} hasPurchased={hasPurchased} />
}
