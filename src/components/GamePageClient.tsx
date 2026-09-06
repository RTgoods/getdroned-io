'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GameSidebar } from './GameSidebar'
import { GameLanding } from './GameLanding'
import { DonationPopup } from './DonationPopup'
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
  const [completedSectors, setCompletedSectors] = useState<number[]>([])
  const [showDonation, setShowDonation] = useState(false)

  const price = game.price_cents > 0 ? `$${(game.price_cents / 100).toFixed(2)}` : 'FREE'

  // ── Auth + purchase state ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    async function loadAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user && game.price_cents > 0) {
        const { data: p } = await supabase
          .from('purchases').select('id')
          .eq('user_id', user.id).eq('game_id', game.id).eq('status', 'completed')
          .maybeSingle()
        setHasPurchased(!!p)
      }
      setAuthReady(true)
    }
    loadAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setHasPurchased(false)
    })
    return () => subscription.unsubscribe()
  }, [game.id, game.price_cents])

  // ── Progress: load from server (paid) or localStorage (free) ─────
  useEffect(() => {
    if (!authReady) return
    if (user && hasPurchased) {
      fetch(`/api/progress?gameId=${game.id}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.completedSectors)) setCompletedSectors(d.completedSectors) })
        .catch(() => {})
    } else {
      try {
        const saved = localStorage.getItem('gd:progress')
        if (saved) setCompletedSectors(JSON.parse(saved))
      } catch {}
    }
  }, [authReady, user, hasPurchased, game.id])

  // ── Handle sector-complete messages from the game iframe ──────────
  const handleSectorComplete = useCallback((sector: number) => {
    setCompletedSectors(prev => {
      if (prev.includes(sector)) return prev
      const next = [...prev, sector].sort((a, b) => a - b)

      if (user && hasPurchased) {
        // Save to server for paid players
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id, sector }),
        }).catch(() => {})
      } else {
        // Save to localStorage for free players
        try { localStorage.setItem('gd:progress', JSON.stringify(next)) } catch {}
        // Show donation popup when free player clears sector 1
        if (sector === 1 && !hasPurchased) {
          setTimeout(() => setShowDonation(true), 1200)
        }
      }
      return next
    })
  }, [user, hasPurchased, game.id])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'gd:sectorComplete' && typeof e.data.sector === 'number') {
        handleSectorComplete(e.data.sector)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [handleSectorComplete])

  // ── Reset progress ────────────────────────────────────────────────
  const resetProgress = useCallback(async () => {
    if (user && hasPurchased) {
      await fetch(`/api/progress?gameId=${game.id}`, { method: 'DELETE' }).catch(() => {})
    } else {
      try { localStorage.removeItem('gd:progress') } catch {}
    }
    setCompletedSectors([])
  }, [user, hasPurchased, game.id])

  // ── Buy handler ───────────────────────────────────────────────────
  const handleBuy = useCallback(async () => {
    setShowDonation(false)
    if (!user) { window.location.href = '/auth/login'; return }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: game.id }),
    })
    if (res.ok) {
      const { url } = await res.json()
      if (url) window.location.href = url
    }
  }, [user, game.id])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0d0b' }}>
      <GameSidebar
        game={game}
        user={authReady ? user : null}
        hasPurchased={hasPurchased}
        completedSectors={completedSectors}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onBack={() => setPlaying(false)}
        onReset={resetProgress}
      />

      <div style={{ flex: 1, height: '100vh', overflow: 'hidden', position: 'relative' }}>
        {playing ? (
          game.play_url ? (
            <iframe
              src={`${game.play_url}?v=27`}
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

      {/* Donation popup — shown when free player clears sector 1 */}
      {showDonation && !hasPurchased && (
        <DonationPopup
          price={price}
          onBuy={handleBuy}
          onDismiss={() => setShowDonation(false)}
        />
      )}
    </div>
  )
}
