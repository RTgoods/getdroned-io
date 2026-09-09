'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GameSidebar } from './GameSidebar'
import { GameLanding } from './GameLanding'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

export function GamePageClient({ game }: { game: Game }) {
  const [playing, setPlaying] = useState(false)
  const [launch, setLaunch] = useState({ level: 1, version: 0 })
  const [user, setUser] = useState<User | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [completedSectors, setCompletedSectors] = useState<number[]>([])
  const frame = useRef<HTMLIFrameElement>(null)
  const loadAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/access', { cache: 'no-store' })
      if (!response.ok) throw new Error('Access check failed')
      const access = await response.json()
      setUser(access.user); setAllowed(access.allowed); setIsAdmin(access.isAdmin); setGameId(access.gameId)
      if (!access.user) setPlaying(false)
      return access
    } catch {
      setUser(null); setAllowed(false); setIsAdmin(false); setPlaying(false)
      return null
    } finally { setReady(true) }
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

  useEffect(() => {
    setCompletedSectors([])
    if (allowed && gameId) fetch(`/api/progress?gameId=${gameId}`).then(r => r.json()).then(d => {
      if (Array.isArray(d.completedSectors)) setCompletedSectors(d.completedSectors)
    }).catch(() => {})
  }, [allowed, gameId, user?.id])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || !allowed || !gameId) return
      const sector = event.data?.sector
      if (event.data?.type !== 'gd:sectorComplete' || !Number.isInteger(sector) || sector < 1 || sector > 6) return
      fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId, sector }) })
        .then(r => r.json()).then(d => { if (Array.isArray(d.completedSectors)) setCompletedSectors(d.completedSectors) }).catch(() => {})
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [allowed, gameId])

  const play = async (level = 1) => {
    const access = await loadAccess()
    if (!access?.user) { window.location.href = '/auth/login'; return }
    if (access.allowed || level === 1) {
      setLaunch(previous => ({ level: Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1, version: previous.version + 1 }))
      setPlaying(true)
    }
  }
  const reset = async () => {
    if (!allowed || !gameId) return
    const response = await fetch(`/api/progress?gameId=${gameId}`, { method: 'DELETE' })
    if (response.ok) setCompletedSectors([])
  }

  return <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#0c0d0b' }}>
    <GameSidebar game={game} user={user} hasPurchased={allowed} completedSectors={completedSectors} playing={playing} onPlay={play} onBack={() => setPlaying(false)} onReset={reset} />
    <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {isAdmin && !playing && <Link href="/admin" className="absolute top-3 right-4 z-10 bg-[#172019] text-[#e2b13c] border border-[#596449] rounded px-4 py-2">Admin · Stage select</Link>}
      {!ready ? <p className="p-8 text-[#e8e4d8]">Checking access…</p> : playing && user && (allowed || launch.level === 1) ? (
        <iframe key={launch.version} ref={frame} src={`/get-droned/index.html?v=47&autostart=${launch.level}`} style={{ display: 'block', width: '100%', height: '100%', border: 'none' }} allowFullScreen title={game.title} allow="autoplay; fullscreen; pointer-lock" />
      ) : <GameLanding game={game} user={user} hasPurchased={allowed} onPlay={() => play(1)} />}
    </div>
  </div>
}
