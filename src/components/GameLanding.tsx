'use client'

import { useState } from 'react'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const SECTORS = [
  { num: 1, name: 'THE COMPOUND',   cover: '/get-droned/assets/images/covers/level-1.webp' },
  { num: 2, name: 'THE TRENCHES',   cover: '/get-droned/assets/images/covers/level-2.webp' },
  { num: 3, name: 'THE BLACK SEA',  cover: '/get-droned/assets/images/covers/level-3.webp' },
  { num: 4, name: 'THE OIL FIELDS', cover: '/get-droned/assets/images/covers/level-4.webp' },
  { num: 5, name: 'THE AIRFIELD',   cover: '/get-droned/assets/images/covers/level-5.webp' },
  { num: 6, name: 'RED SQUARE',     cover: '/get-droned/assets/images/covers/level-6-red-square.webp' },
]

const SPECS = [
  { label: 'PLATFORM', value: 'Any browser' },
  { label: 'GENRE',    value: 'Top-down shooter' },
  { label: 'SECTORS',  value: '6 + boss fights' },
  { label: 'INSTALL',  value: 'None required' },
]

interface Props {
  game: Game
  user: User | null
  hasPurchased: boolean
  onPlay: () => void
}

export function GameLanding({ game, user, hasPurchased, onPlay }: Props) {
  const price = game.price_cents > 0
    ? `$${(game.price_cents / 100).toFixed(2)}`
    : 'FREE'
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState('')

  const handleBuy = async () => {
    if (!user) { window.location.href = '/auth/login'; return }
    setBuyLoading(true); setBuyError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : 'Checkout failed')
      setBuyLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#0c0d0b', color: '#e8e4d8' }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(220px, 42vh, 480px)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/get-droned/assets/images/covers/main-cover.webp"
          alt="Get Droned"
          className="w-full h-full object-cover object-top block"
          fetchPriority="high"
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, #0c0d0b 0%, rgba(12,13,11,0.4) 55%, rgba(12,13,11,0.05) 100%)',
        }} />
        {/* scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        }} />

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 sm:pb-8">
          <div className="text-[8px] font-black tracking-[3px] mb-2" style={{ color: '#c0562f' }}>
            Slava Ukraini
          </div>
          <h1
            className="font-black uppercase leading-none m-0"
            style={{
              fontSize: 'clamp(28px, 5vw, 60px)',
              letterSpacing: '0.12em',
              color: '#f2ead2',
              textShadow: '0 4px 0 #1a160e',
            }}
          >
            GET DRONED
          </h1>
          <p className="mt-2 text-[11px] tracking-[2px] uppercase max-w-md hidden sm:block" style={{ color: '#9a9288' }}>
            {game.tagline ?? 'Six sectors of aerial combat. No installs. No mercy.'}
          </p>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-8 pb-16">

        {/* Tagline on mobile (hidden in hero) */}
        <p className="sm:hidden mt-3 mb-0 text-[10px] tracking-[1.5px] uppercase leading-relaxed" style={{ color: '#6e6a60' }}>
          {game.tagline ?? 'Six sectors of aerial combat. No installs. No mercy.'}
        </p>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="py-6 sm:py-8" style={{ borderBottom: '1px solid rgba(226,177,60,0.12)' }}>

          {hasPurchased ? (
            /* Owned — single full-access deploy button */
            <div>
              <button
                onClick={onPlay}
                style={{
                  width: '100%', background: 'linear-gradient(180deg,#c0562f,#7d3016)',
                  color: '#fff', border: 'none', borderRadius: 3,
                  padding: '15px 32px', fontWeight: 900, fontSize: 12,
                  letterSpacing: '3px', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '0 3px 0 #4a1b0c',
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                ▶ DEPLOY NOW — ALL SECTORS UNLOCKED
              </button>
              <p className="mt-2 text-center text-[8px] font-black tracking-[2px] uppercase" style={{ color: '#9db35a' }}>
                MISSION UNLOCKED · FULL ACCESS
              </p>
            </div>
          ) : (
            /* Not owned — two-button split */
            <div className="flex flex-col sm:flex-row gap-3">

              {/* ── TRY: Sector One ── */}
              <button
                onClick={onPlay}
                className="flex-1 group"
                style={{
                  background: 'rgba(157,179,90,0.08)',
                  border: '1px solid rgba(157,179,90,0.30)',
                  borderRadius: 4, padding: '0',
                  cursor: 'pointer', transition: 'border-color 180ms, background 180ms',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(157,179,90,0.6)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(157,179,90,0.14)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(157,179,90,0.30)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(157,179,90,0.08)'
                }}
              >
                <div style={{ padding: '18px 24px' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 16, color: '#9db35a' }}>▶</span>
                    <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '2.5px', color: '#d4e8a0', textTransform: 'uppercase' }}>
                      Fly Sector One
                    </span>
                  </div>
                  <p style={{ fontSize: 9, color: '#6a7a50', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                    Free · The Compound · No login required
                  </p>
                </div>
              </button>

              {/* ── BUY: Full access ── */}
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="flex-1"
                style={{
                  background: 'linear-gradient(160deg,#b84f2a 0%,#7d2f14 60%,#5c1f0a 100%)',
                  border: '1px solid rgba(192,86,47,0.5)',
                  borderRadius: 4, padding: '0',
                  cursor: buyLoading ? 'default' : 'pointer',
                  boxShadow: '0 4px 20px rgba(192,86,47,0.25), 0 2px 0 #3a1508',
                  opacity: buyLoading ? 0.7 : 1,
                  transition: 'filter 180ms',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!buyLoading) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
              >
                <div style={{ padding: '18px 24px' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '2.5px', color: '#fff', textTransform: 'uppercase' }}>
                      {buyLoading ? 'Redirecting…' : 'Unlock All Sectors'}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#e2b13c', letterSpacing: '1px' }}>
                      {price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, lineHeight: 1 }}>🇺🇦</span>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                      50% to Ukraine relief · one-time · no subscription
                    </p>
                  </div>
                </div>
              </button>

            </div>
          )}

          {buyError && (
            <p className="mt-2 text-[9px] font-black tracking-[2px] uppercase" style={{ color: '#e04b3c' }}>
              {buyError}
            </p>
          )}
        </div>

        {/* ── ABOUT ────────────────────────────────────────── */}
        <div className="py-5 sm:py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[8px] font-black tracking-[3px] uppercase mb-3" style={{ color: '#e2b13c' }}>
            ABOUT THIS GAME
          </div>
          <p className="text-[12.5px] leading-relaxed max-w-xl" style={{ color: '#9a9288' }}>
            {game.long_description ?? game.description ?? 'A fast-paced browser shooter with six escalating levels of drone warfare.'}
          </p>
        </div>

        {/* ── SECTOR INTEL ─────────────────────────────────── */}
        <div className="py-5 sm:py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[8px] font-black tracking-[3px] uppercase mb-4" style={{ color: '#e2b13c' }}>
            SECTOR INTEL
          </div>
          {/* 2-col on mobile, 3-col on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTORS.map((s) => (
              <div key={s.num} className="relative rounded-sm overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.cover}
                  alt={s.name}
                  className="w-full h-full object-cover block"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }}
                />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(12,13,11,0.92) 0%, rgba(12,13,11,0.2) 60%, transparent 100%)',
                }} />
                <div className="absolute bottom-0 left-0 p-1.5 sm:p-2">
                  <div className="text-[6px] font-black tracking-[2px] uppercase" style={{ color: '#c0562f' }}>
                    SECTOR {s.num}
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-black uppercase tracking-wide mt-0.5" style={{ color: '#f2ead2' }}>
                    {s.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SPECS — hidden on mobile ─────────────────────── */}
        <div className="hidden sm:block pt-5 sm:pt-7">
          <div className="text-[8px] font-black tracking-[3px] uppercase mb-4" style={{ color: '#e2b13c' }}>
            MISSION SPECS
          </div>
          {/* 1-col on mobile, 2-col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {SPECS.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[9px] font-black tracking-[2px] uppercase" style={{ color: '#6e6a60' }}>
                  {label}
                </span>
                <span className="text-[10px]" style={{ color: '#a9a396' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
