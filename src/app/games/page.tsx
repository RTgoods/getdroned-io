import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/GameCard'
import { STATIC_GAMES } from '@/lib/games-catalog'
import type { Game } from '@/types/database'

export const metadata: Metadata = {
  title: 'Store',
  description: 'Browse all AI-crafted browser games. Buy once, play forever.',
}

export default async function GamesPage() {
  const supabase = await createClient()

  const { data: rawGames } = await supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('release_date', { ascending: false })

  const games = ((rawGames ?? []) as Game[]).length > 0
    ? (rawGames as Game[])
    : STATIC_GAMES
  const genres = Array.from(
    new Set(games.map((g) => g.genre).filter(Boolean))
  ) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-[#a78bfa] mb-2">Store</p>
        <h1 className="text-4xl font-black mb-3">All Games</h1>
        <p className="text-slate-400">Buy once, play forever in your browser.</p>
      </div>

      {/* Genre filters (shown when multiple genres exist) */}
      {genres.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="px-3 py-1 rounded-full text-sm bg-[#7c3aed] text-white">All</span>
          {genres.map((genre) => (
            <span
              key={genre}
              className="px-3 py-1 rounded-full text-sm border border-[#1e1e3a] text-slate-400 hover:border-[#7c3aed] hover:text-white cursor-pointer transition-colors"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {games.length === 0 ? (
        <div className="text-center py-32">
          <div className="text-6xl mb-4">🕹️</div>
          <h2 className="text-xl font-semibold mb-2 text-slate-300">No games yet</h2>
          <p className="text-slate-500">Check back soon — new titles are on the way.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
