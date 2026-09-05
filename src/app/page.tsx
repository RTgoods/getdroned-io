import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { STATIC_GAMES } from '@/lib/games-catalog'
import { GamePageClient } from '@/components/GamePageClient'
import type { Game } from '@/types/database'

function safeUrl(value: string | undefined): string {
  if (!value) return 'https://placeholder.supabase.co'
  try { new URL(value); return value } catch { return 'https://placeholder.supabase.co' }
}

// Public game metadata — no cookies needed, safe to cache for 60 s
const getGame = unstable_cache(
  async (slug: string) => {
    const supabase = createSupabaseClient(
      safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
    )
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

  // Game metadata — cached, no cookies inside
  const game = await getGame('get-droned')

  // Auth — per-request (reads cookies)
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
