'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GameSidebar } from './GameSidebar'
import { GameLanding } from './GameLanding'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface Props {
  game: Game
}

export function GamePageClient({ game }: Props) {
  const [playing, setPlaying] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function loadAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user && game.price_cents > 0) {
        const { data: p } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .eq('status', 'completed')
          .maybeSingle()
        setHasPurchased(!!p)
      }

      setAuthReady(true)
    }

    loadAuth()

    // Keep auth state in sync (login / logout from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setHasPurchased(false)
    })

    return () => subscription.unsubscribe()
  }, [game.id, game.price_cents])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0d0b' }}>
      <GameSidebar
        game={game}
        user={authReady ? user : null}
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
            user={authReady ? user : null}
            hasPurchased={hasPurchased}
            onPlay={() => setPlaying(true)}
          />
        )}
      </div>
    </div>
  )
}
