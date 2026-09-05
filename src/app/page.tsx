import { STATIC_GAMES } from '@/lib/games-catalog'
import { GamePageClient } from '@/components/GamePageClient'

// Static page — served from Vercel's edge CDN instantly.
// Auth + purchase state load client-side in GamePageClient.
export const dynamic = 'force-static'
export const revalidate = 3600 // refresh every hour

export default function HomePage() {
  const game = STATIC_GAMES.find((g) => g.slug === 'get-droned')!
  return <GamePageClient game={game} />
}
