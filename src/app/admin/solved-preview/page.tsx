import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isGameAdmin } from '@/lib/game-access'
import { STATIC_GAMES } from '@/lib/games-catalog'
import { GamePageClient } from '@/components/GamePageClient'

export const dynamic = 'force-dynamic'

export default async function SolvedPreviewPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin')
  if (!isGameAdmin(user)) redirect('/')
  const { card } = await searchParams
  if (!card || !/^(?:[1-6]|complete)$/.test(card)) notFound()
  const game = STATIC_GAMES.find(g => g.slug === 'get-droned')!
  return <GamePageClient game={game} solvedPreview={card} />
}
