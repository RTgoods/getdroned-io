'use client'

import { useState } from 'react'
import { GameSidebar } from './GameSidebar'
import { GameLanding } from './GameLanding'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface Props {
  game: Game
  user: User | null
  hasPurchased: boolean
}

export function GamePageClient({ game, user, hasPurchased }: Props) {
  const [playing, setPlaying] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0d0b' }}>
      <GameSidebar
        game={game}
        user={user}
        hasPurchased={hasPurchased}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onBack={() => setPlaying(false)}
      />

      <div style={{ flex: 1, height: '100vh', overflow: 'hidden', position: 'relative' }}>
        {playing ? (
          game.play_url ? (
            <iframe
              src={game.play_url}
              style={{ display: 'block', width: '100%', height: '100%', border: 'none', background: '#0c0d0b' }}
              allowFullScreen
              title={game.title}
              allow="autoplay; fullscreen; pointer-lock"
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '3px', color: '#c0562f', textTransform: 'uppercase' }}>SIGNAL LOST</p>
              <p style={{ fontSize: 11, letterSpacing: '1px', color: '#6e6a60' }}>Game online version coming soon.</p>
            </div>
          )
        ) : (
          <GameLanding
            game={game}
            user={user}
            hasPurchased={hasPurchased}
            onPlay={() => setPlaying(true)}
          />
        )}
      </div>
    </div>
  )
}
