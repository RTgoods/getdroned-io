'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createProgressOutbox } from '@/lib/progress-outbox'
import { createClient } from '@/lib/supabase/client'
import { GameSidebar } from './GameSidebar'
import { ProfileContent } from './ProfileContent'
import { GameLanding } from './GameLanding'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { SectorStat } from '@/app/api/progress/route'

export function GamePageClient({ game, solvedPreview = null }: { game: Game; solvedPreview?: string | null }) {
  const [preview, setPreview] = useState(solvedPreview)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [playing, setPlaying] = useState(!!solvedPreview)
  const [launch, setLaunch] = useState({ level: 1, version: 0, coins: 0, belt: [] as string[], muted: false })
  const [user, setUser] = useState<User | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [ready, setReady] = useState(false) // render the page immediately, but wait before showing account actions
  const [completedSectors, setCompletedSectors] = useState<number[]>([])
  const [sectorStats, setSectorStats] = useState<Record<string, SectorStat>>({})
  const [liveObjectives, setLiveObjectives] = useState<Record<number, number[]>>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [musicMuted, setMusicMuted] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [progressReady, setProgressReady] = useState(false)
  const outbox = useRef<ReturnType<typeof createProgressOutbox> | null>(null)
  const accessRequest = useRef(0)
  const frame = useRef<HTMLIFrameElement>(null)

  const loadAccess = useCallback(async () => {
    const request = ++accessRequest.current
    try {
      const response = await fetch('/api/access', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new Error('Access check failed')
      const access = await response.json()
      if (request !== accessRequest.current) return null
      setConnectionMessage('')
      setUser(access.user); setAllowed(access.allowed); setIsAdmin(access.isAdmin); setGameId(access.gameId)
      if (!access.user) { setPlaying(false); setAvatarUrl(null) }
      else {
        fetch('/api/profile').then(r => r.ok ? r.json() : null).then(p => {
          if (p?.avatar_url) setAvatarUrl(p.avatar_url)
        }).catch(() => {})
      }
      return access
    } catch {
      if (request === accessRequest.current) setConnectionMessage('Connection interrupted — reconnecting. Your game stays open.')
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
    window.addEventListener('online', refresh)
    const timer = setInterval(() => { void loadAccess() }, 60000)
    return () => { subscription.unsubscribe(); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); clearInterval(timer) }
  }, [loadAccess])

  // Retry reads too: a temporary failure must not look like a new pilot.
  useEffect(() => {
    let cancelled = false, loaded = false, reading = false
    setCompletedSectors([]); setSectorStats({}); setProgressReady(false)
    const read = async () => {
      if (cancelled || loaded || reading || !user || !gameId) return
      reading = true
      try {
        const response = await fetch(`/api/progress?gameId=${gameId}`, { signal: AbortSignal.timeout(12000) })
        if (!response.ok) throw new Error('Progress unavailable')
        const data = await response.json()
        if (cancelled) return
        loaded = true; setProgressReady(true); setConnectionMessage('')
        if (Array.isArray(data.completedSectors)) setCompletedSectors(prev => [...new Set([...data.completedSectors, ...prev])] as number[])
        if (data.sectorStats) setSectorStats(prev => ({ ...data.sectorStats, ...prev }))
      } catch {
        if (!cancelled) setConnectionMessage('Sector progress unavailable — retrying automatically.')
      } finally { reading = false }
    }
    if (user && gameId) void read()
    else setProgressReady(true)
    const timer = setInterval(() => { void read() }, 10000)
    window.addEventListener('online', read)
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('online', read) }
  }, [allowed, gameId, user?.id])

  useEffect(() => {
    if (saveMessage !== 'Progress saved') return
    const timer = setTimeout(() => setSaveMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [saveMessage])

  useEffect(() => {
    if (!user || !gameId) return
    let active = true
    const key = `gd:pending-progress:${user.id}:${gameId}`
    const queue = createProgressOutbox({
      getItem: key => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }, key, async entry => {
      const response = await fetch('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry), signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) throw new Error('Save pending')
      const saved = await response.json()
      if (active) {
        setProgressReady(true)
        if (Array.isArray(saved.completedSectors)) setCompletedSectors(saved.completedSectors)
        if (saved.sectorStats) setSectorStats(saved.sectorStats)
      }
    }, message => { if (active) setSaveMessage(message) })
    outbox.current = queue
    void queue.flush()
    const retry = () => { void queue.flush() }
    const timer = setInterval(retry, 10000)
    window.addEventListener('online', retry)
    return () => { active = false; queue.stop(); outbox.current = null; clearInterval(timer); window.removeEventListener('online', retry) }
  }, [user?.id, gameId])

  // Listen for messages from the game iframe
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      const { type } = event.data ?? {}

      if (type === 'gd:objectives') {
        const { sector, completed } = event.data
        if (Number.isInteger(sector) && sector >= 1 && sector <= 6 && Array.isArray(completed)) {
          setLiveObjectives(prev => ({ ...prev, [sector]: completed.filter((i: number) => Number.isInteger(i) && i >= 0 && i < 8) }))
        }
        return
      }

      if (type !== 'gd:sectorComplete' || !user || !gameId) return
      const { sector, kills, squadLost, moneyEnd, timeAlive, belt } = event.data
      if (!Number.isInteger(sector) || sector < 1 || sector > 6) return

      outbox.current?.enqueue({ gameId, sector, kills, squadLost, moneyEnd, timeAlive, belt })
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [allowed, gameId, user])

  const play = useCallback(async (level = 1) => {
    const access = await loadAccess()
    if (!access) return
    if (!access.user) { window.location.href = '/auth/login'; return }

    // Sector 1 is always free; sectors 2–6 require purchase + previous sector complete (unless admin)
    const prevDone = completedSectors.includes(level - 1)
    const canPlay = level === 1 || access.isAdmin || (access.allowed && prevDone)
    if (!canPlay) return

    // Derive carry state from the sector just before the one being launched
    const prevStat = level > 1 ? sectorStats[String(level - 1)] : null
    const carryCoins = prevStat?.moneyEnd ?? 0
    const carryBelt = prevStat?.belt ?? []

    setPreview(null)
    setLiveObjectives({})
    setLaunch(previous => ({
      level: Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1,
      version: previous.version + 1,
      coins: carryCoins,
      belt: carryBelt,
      muted: localStorage.getItem('gd_muted') === '1', // read the latest preference at launch
    }))
    setPlaying(true)
  }, [completedSectors, sectorStats, loadAccess])

  const continueLevel = completedSectors.length === 6 ? 1 : [1,2,3,4,5,6].find(n => !completedSectors.includes(n)) || 1

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
    if (preview) return `/get-droned/index.html?solvedPreview=${encodeURIComponent(preview)}`
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
      liveObjectives={liveObjectives}
      playing={playing}
      onPilotSettings={() => {
        frame.current?.contentWindow?.postMessage({ type: 'gd:pilotSettings', open: true }, window.location.origin)
        setSettingsOpen(true)
      }}
      onPlay={play}
      onBack={() => {
        frame.current?.contentWindow?.postMessage({ type: 'gd:setMute', muted: true }, '*')
        setPlaying(false)
      }}
      onReset={reset}
      avatarUrl={avatarUrl}
    />
    <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflow: 'hidden', position: 'relative', isolation: 'isolate' }}>
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
      ) : <GameLanding game={game} user={user} hasPurchased={allowed} continueLevel={continueLevel} completedCount={completedSectors.length} accessReady={ready && progressReady} onPlay={() => play(allowed ? continueLevel : 1)} />}
      {(connectionMessage || saveMessage) && <div role="status" aria-live="polite" style={{ position: 'absolute', bottom: playing ? 120 : 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, maxWidth: '90%', width: 'max-content', padding: '8px 12px', borderRadius: 6, background: '#091a30', color: '#ffd700', border: '1px solid #3878b8', fontSize: 12, pointerEvents: 'none' }}>{connectionMessage || saveMessage}</div>}
      {settingsOpen && user && (
        <div role="dialog" aria-modal="true" aria-label="Pilot Settings" style={{ position: 'absolute', inset: 0, zIndex: 1000, background: '#09101f', overflowY: 'auto' }}>
          <ProfileContent game={game} user={user} hasPurchased={allowed} isAdmin={isAdmin} completedSectors={completedSectors} sectorStats={sectorStats} avatarUrl={avatarUrl} gameId={gameId}
            onReturnToGame={() => {
              setSettingsOpen(false)
              setMusicMuted(localStorage.getItem('gd_muted') === '1')
              frame.current?.contentWindow?.postMessage({ type: 'gd:pilotSettings', open: false }, window.location.origin)
              frame.current?.focus()
              void loadAccess()
            }} />
        </div>
      )}
    </div>
  </div>
}
