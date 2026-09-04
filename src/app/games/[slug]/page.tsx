import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BuyButton } from '@/components/BuyButton'
import { formatPrice } from '@/components/GameCard'
import { STATIC_GAMES } from '@/lib/games-catalog'
import type { Game } from '@/types/database'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: rawGame } = await supabase
    .from('games')
    .select('title, tagline, thumbnail_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const game = (rawGame as Pick<Game, 'title' | 'tagline' | 'thumbnail_url'> | null) ??
    STATIC_GAMES.find((g) => g.slug === slug) ??
    null
  if (!game) return {}
  return {
    title: game.title,
    description: game.tagline ?? undefined,
    openGraph: {
      title: game.title,
      description: game.tagline ?? undefined,
      images: game.thumbnail_url ? [game.thumbnail_url] : [],
    },
  }
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: rawGame } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const game = (rawGame as Game | null) ??
    STATIC_GAMES.find((g) => g.slug === slug) ??
    null
  if (!game) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasPurchased = false
  if (user && game.price_cents > 0) {
    const { data: rawPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', game.id)
      .eq('status', 'completed')
      .maybeSingle()
    hasPurchased = !!rawPurchase
  }

  const screenshots = (game.screenshots ?? []) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-8 flex items-center gap-2">
        <Link href="/games" className="hover:text-[#a78bfa] transition-colors">
          Store
        </Link>
        <span>/</span>
        <span className="text-slate-300">{game.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero image */}
          <div className="aspect-[16/9] relative rounded-2xl overflow-hidden bg-[#16162a]">
            {game.thumbnail_url ? (
              <Image
                src={game.thumbnail_url}
                alt={game.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] to-[#07070f] flex items-center justify-center">
                <span className="text-8xl">🎮</span>
              </div>
            )}
          </div>

          {/* Title & tags */}
          <div>
            <h1 className="text-4xl font-black mb-3">{game.title}</h1>
            {game.tagline && (
              <p className="text-xl text-slate-400 mb-4">{game.tagline}</p>
            )}
            {game.tags && game.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full bg-[#1e1e3a] text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {game.long_description && (
            <section>
              <h2 className="text-lg font-bold mb-4 border-b border-[#1e1e3a] pb-3">
                About this game
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {game.long_description}
              </p>
            </section>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 border-b border-[#1e1e3a] pb-3">
                Screenshots
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {screenshots.map((src: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-[16/9] relative rounded-xl overflow-hidden bg-[#16162a]"
                  >
                    <Image src={src} alt={`Screenshot ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-[#1e1e3a] bg-[#0f0f1a] p-6 space-y-6">
            <div>
              <div className="text-4xl font-black mb-1">{formatPrice(game.price_cents)}</div>
              {game.price_cents > 0 && (
                <p className="text-xs text-slate-500">One-time purchase</p>
              )}
            </div>

            <BuyButton game={game} userId={user?.id} hasPurchased={hasPurchased} />

            <div className="pt-4 border-t border-[#1e1e3a] space-y-3 text-sm">
              {[
                { label: 'Platform', value: 'Browser (any)' },
                { label: 'Genre', value: game.genre ?? 'Action' },
                { label: 'Release', value: game.release_date ?? 'Now' },
                { label: 'Installs', value: 'None required' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
