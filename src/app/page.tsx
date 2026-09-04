import { createClient } from '@/lib/supabase/server'
import { STATIC_GAMES } from '@/lib/games-catalog'
import { GamePageClient } from '@/components/GamePageClient'
import type { Game } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()
  const slug = 'get-droned'

  const { data: rawGame } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const game = (rawGame as Game | null) ??
    STATIC_GAMES.find((g) => g.slug === slug)!

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
