import Link from 'next/link'
import Image from 'next/image'
import type { Game } from '@/types/database'

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

export function GameCard({ game, owned }: { game: Game; owned?: boolean }) {
  return (
    <Link
      href={owned ? `/${game.slug}` : `/games/${game.slug}`}
      className="group relative block rounded-2xl border border-[#1e1e3a] bg-[#0f0f1a] overflow-hidden card-glow hover:border-[#7c3aed]/50"
    >
      {/* Thumbnail */}
      <div className="aspect-[16/9] relative bg-[#16162a] overflow-hidden">
        {game.thumbnail_url ? (
          <Image
            src={game.thumbnail_url}
            alt={game.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] to-[#07070f] flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[#7c3aed]/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14m0 0V10m0 4H7a2 2 0 01-2-2V8a2 2 0 012-2h8m0 8v-4"
              />
            </svg>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {owned ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-sm">
              Owned
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07070f]/80 border border-[#1e1e3a] backdrop-blur-sm text-slate-200">
              {formatPrice(game.price_cents)}
            </span>
          )}
        </div>

        {/* Featured badge */}
        {game.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#7c3aed]/90 text-white backdrop-blur-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-lg leading-snug mb-1.5 group-hover:text-[#a78bfa] transition-colors">
          {game.title}
        </h3>
        {game.tagline && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-3">{game.tagline}</p>
        )}
        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {game.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e3a] text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
