'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GameSidebar } from './GameSidebar'
import { GameLanding } from './GameLanding'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { SectorStat } from '@/app/api/progress/route'

export function GamePageClient({ game }: { game: Game }) {
  const [playing, setPlaying] = useState(false)
  const [launch, setLaunch] = useState({ level: 1, version: 0, coins: 0, belt: [] as string[], muted: false })
  const [user, setUser] = useState<User | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [ready, setReady] = useState(true) // show landing immediately; auth check runs in background
  const [completedSectors, setCompletedSectors] = useState<number[]>([])
  const [sectorStats, setSectorStats] = useState<Record<string, SectorStat>>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [musicMuted, setMusicMuted] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)

  const loadAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/access', { cache: 'no-store' })
      if (!response.ok) throw new Error('Access check failed')
      const access = await response.json()
      setUser(access.user); setAllowed(access.allowed); setIsAdmin(access.isAdmin); setGameId(access.gameId)
      if (!access.user) { setPlaying(false); setAvatarUrl(null) }
      else {
        fetch('/api/profile').then(r => r.ok ? r.json() : null).then(p => {
          if (p?.avatar_url) setAvatarUrl(p.avatar_url)
        }).catch(() => {})
      }
      return access
    } catch {
      setUser(null); setAllowed(false); setIsAdmin(false); setPlaying(false)
      return null
    } finally { setReady(true) }
  }, [])

  useEffect(() => {
    setMusicMuted(localStorage.getItem('gd_muted') === '1')
  }, [])

  useEffect(() => {
    void loadAccess()
    const db = createClient()
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { void loadAccess() })
    const refresh = () => { if (document.visibilityState === 'visible') void loadAccess() }
    document.addEventListener('visibilitychange', refresh)
    const timer = setInterval(() => { void loadAccess() }, 60000)
    return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', refresh); clearInterval(timer) }
  }, [loadAccess])

  // Load progress (completed sectors + stats + carry state) when access is granted
  useEffect(() => {
    setCompletedSectors([])
    setSectorStats({})
    if (allowed && gameId) {
      fetch(`/api/progress?gameId=${gameId}`)
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d.completedSectors)) setCompletedSectors(d.completedSectors)
          if (d.sectorStats && typeof d.sectorStats === 'object') setSectorStats(d.sectorStats)
        })
        .catch(() => {})
    }
  }, [allowed, gameId, user?.id])

  // Listen for sector-complete messages from the game iframe
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || !allowed || !gameId) return
      const { type, sector, kills, squadLost, moneyEnd, timeAlive, belt } = event.data ?? {}
      if (type !== 'gd:sectorComplete' || !Number.isInteger(sector) || sector < 1 || sector > 6) return

      // Save to DB and get carry state back
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, sector, kills, squadLost, moneyEnd, timeAlive, belt }),
        })
        const d = await res.json()
        if (Array.isArray(d.completedSectors)) setCompletedSectors(d.completedSectors)
        if (d.sectorStats && typeof d.sectorStats === 'object') setSectorStats(d.sectorStats)
      } catch { /* ignore — game continues in-engine */ }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [allowed, gameId])

  const play = useCallback(async (level = 1) => {
    const access = await loadAccess()
    if (!access?.user) { window.location.href = '/auth/login'; return }

    // Sector 1 is always free; sectors 2–6 require purchase + previous sector complete (unless admin)
    const prevDone = completedSectors.includes(level - 1)
    const canPlay = level === 1 || access.isAdmin || (access.allowed && (level === 2 || prevDone))
    if (!canPlay) return

    // Derive carry state from the sector just before the one being launched
    const prevStat = level > 1 ? sectorStats[String(level - 1)] : null
    const carryCoins = prevStat?.moneyEnd ?? 0
    const carryBelt = prevStat?.belt ?? []

    setLaunch(previous => ({
      level: Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1,
      version: previous.version + 1,
      coins: carryCoins,
      belt: carryBelt,
      muted: musicMuted, // snapshot at launch — live toggle uses postMessage only
    }))
    setPlaying(true)
  }, [completedSectors, sectorStats, loadAccess])

  const reset = async () => {
    if (!allowed || !gameId) return
    const response = await fetch(`/api/progress?gameId=${gameId}`, { method: 'DELETE' })
    if (response.ok) {
      setCompletedSectors([])
      setSectorStats({})
    }
  }

  // Build the iframe src with carry-over params
  const iframeSrc = (() => {
    const params = new URLSearchParams({ v: '47', autostart: String(launch.level) })
    if (isAdmin) params.set('coins', '5000')
    else if (launch.coins > 0) params.set('coins', String(launch.coins))
    if (launch.belt.length > 0 && !isAdmin) params.set('belt', launch.belt.join(','))
    if (isAdmin && game.rec_enabled) params.set('rec', '1')
    if (launch.muted) params.set('mute', '1')
    return `/get-droned/index.html?${params.toString()}`
  })()

  return <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#0c0d0b' }}>
    <GameSidebar
      game={game}
      user={user}
      hasPurchased={allowed}
      isAdmin={isAdmin}
      completedSectors={completedSectors}
      sectorStats={sectorStats}
      playing={playing}
      onPlay={play}
      onBack={() => {
        frame.current?.contentWindow?.postMessage({ type: 'gd:setMute', muted: true }, '*')
        setPlaying(false)
      }}
      onReset={reset}
      avatarUrl={avatarUrl}
      onMuteToggle={(muted) => {
        setMusicMuted(muted)
        frame.current?.contentWindow?.postMessage({ type: 'gd:setMute', muted }, '*')
      }}
    />
    <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {playing && user && (allowed || isAdmin || launch.level === 1) ? (
        <iframe
          key={launch.version}
          ref={frame}
          src={iframeSrc}
          style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          title={game.title}
          allow="autoplay; fullscreen; pointer-lock"
        />
      ) : <GameLanding game={game} user={user} hasPurchased={allowed} onPlay={() => play(1)} />}
    </div>
  </div>
}
