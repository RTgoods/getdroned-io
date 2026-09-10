'use client'

import { EquipmentGuide } from './EquipmentGuide'
import { useState } from 'react'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const SECTORS = [
  { num: 1, terrain: 'Compound assault', briefing: 'Fight through a battered compound, clear enemy positions and capture the flags. Launch drones from your base before confronting Franks and Hammers.', name: 'FRANKS AND HAMMERS', cover: '/get-droned/assets/images/covers/level-1.png?v=2' },
  { num: 2, terrain: 'Trench warfare', briefing: 'Navigate a maze of trenches beneath burnt trees and shattered ground. Use narrow approaches, cover and drone support to reach the enemy strongholds.', name: 'THE TRENCHES',   cover: '/get-droned/assets/images/covers/level-2.png?v=1' },
  { num: 3, terrain: 'Naval combat', briefing: 'Take the fight offshore. Pilot sea drones, board your gunboat and attack hostile ships while defending your coastal base.', name: 'THE BLACK SEA',  cover: '/get-droned/assets/images/covers/level-3.png?v=1' },
  { num: 4, terrain: 'Industrial assault', briefing: 'Battle through an oil refinery complex packed with tanks, pipes and industrial cover. Watch for machine-gun towers that threaten both you and your drones.', name: 'THE OIL FIELDS', cover: '/get-droned/assets/images/covers/level-4.png?v=1' },
  { num: 5, terrain: 'Winter operations', briefing: 'Push across a snow-covered airfield in winter gear. Work around aircraft, icy open ground and snow-laden trees as you close in on the boss.', name: 'THE AIRFIELD',   cover: '/get-droned/assets/images/covers/level-5.png?v=2' },
  { num: 6, terrain: 'City showdown', briefing: 'Fight through city streets beneath Red Square-inspired landmarks. Break through the final defenses and face the mounted boss.', name: 'RED SQUARE',     cover: '/get-droned/assets/images/covers/level-6.png?v=1' },
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

      {/* ── Responsive hero height ─────────────────────────────────────── */}
      <style>{`
        .gd-hero { height: clamp(340px, 68vh, 640px); }
        @media (max-width: 640px) {
          .gd-hero { height: clamp(200px, 38vh, 320px); }
          .gd-hero img { object-position: center 20%; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="gd-hero relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/get-droned/assets/images/covers/main-cover.png?v=2"
          alt="Get Droned"
          className="w-full h-full object-cover object-top block"
          fetchPriority="high"
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, #0c0d0b 0%, rgba(12,13,11,0.55) 30%, rgba(12,13,11,0.0) 65%)',
        }} />
        {/* scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        }} />

        {/* Hero text — pushed to very bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-3 sm:pb-5">
          <div className="text-[8px] font-black tracking-[3px] mb-1" style={{ color: '#ffd700' }}>
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
          <p className="mt-1 text-[11px] tracking-[2px] uppercase max-w-md hidden sm:block" style={{ color: '#9a9288' }}>
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
                  width: '33%', background: 'linear-gradient(180deg,#ffd700 0%,#e5b900 100%)',
                  color: '#003580', border: 'none', borderRadius: 4,
                  padding: '18px 32px', fontWeight: 900, fontSize: 13,
                  letterSpacing: '3px', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '0 4px 0 #977800, 0 8px 24px rgba(255,215,0,0.3)',
                  transition: 'filter 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                ▶ PLAY GAME
              </button>
              <p className="mt-2 text-center text-[8px] font-black tracking-[2px] uppercase" style={{ color: '#9db35a' }}>
                MISSION UNLOCKED · FULL ACCESS
              </p>
            </div>
          ) : (
            /* Not owned — two-button split */
            <><div className="flex flex-col sm:flex-row gap-2" style={{ maxWidth: 480 }}>

              <div className="flex-1">
                {user ? <button onClick={onPlay} className="w-full rounded px-4 font-bold" style={{ background: '#0057b7', color: '#fff', height: '100%', minHeight: 52, fontSize: 11, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.4 }}>PLAY SECTOR 1 FREE</button> : <a href="/auth/login" className="flex items-center justify-center rounded px-4 font-bold" style={{ background: '#0057b7', color: '#fff', height: '100%', minHeight: 52, fontSize: 11, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.4 }}>PLAY SECTOR 1 FREE — SIGN IN</a>}
              </div>
              {/* ── UNLOCK: Full access — Ukraine yellow ── */}
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="flex-1"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, padding: '10px 14px', minHeight: 52,
                  background: 'linear-gradient(180deg,#f5c800 0%,#c89e00 100%)',
                  border: '1px solid rgba(245,200,0,0.45)',
                  borderRadius: 4,
                  cursor: buyLoading ? 'default' : 'pointer',
                  boxShadow: '0 2px 0 #7a6000, 0 4px 14px rgba(245,200,0,0.20)',
                  opacity: buyLoading ? 0.7 : 1,
                  transition: 'filter 150ms',
                }}
                onMouseEnter={e => { if (!buyLoading) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, lineHeight: 1 }}>🇺🇦</span>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '2px', color: '#1a1000', textTransform: 'uppercase' }}>
                    {buyLoading ? 'Redirecting…' : 'Unlock all Sectors'}
                  </span>
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 900, color: '#1a1000',
                  background: 'rgba(0,0,0,0.10)', borderRadius: 3,
                  padding: '2px 7px', letterSpacing: '0.5px', flexShrink: 0,
                }}>{price}</span>
              </button>

            </div>
            <p style={{ margin: '6px 0 0', fontSize: 8, letterSpacing: '1.5px', color: '#9a9288', textTransform: 'uppercase' }}>
              100% of proceeds go to Ukraine relief · one-time payment
            </p></>
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

        <section className="py-7 sm:py-10 border-b border-white/10" aria-labelledby="sector-intel-title">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-[#0057b7]" />
            <p className="text-[9px] font-black tracking-[3px] uppercase text-[#ffd700]">Sector Intel</p>
          </div>
          <h2 id="sector-intel-title" className="text-2xl sm:text-3xl font-black text-[#f2ead2]">Six sectors. Six battlefields.</h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-[#a9b4b9] max-w-xl">From ruined compounds to open water and frozen runways, every sector calls for a different approach.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {SECTORS.map(s => (
              <article key={s.num} className="overflow-hidden rounded-lg border border-[#263746] bg-[#0d1720]">
                <div className="relative aspect-video bg-[#101e2a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.cover} alt={s.name} loading="lazy" className="w-full h-full object-cover block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08131e]/90 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 text-[10px] font-black tracking-[2px] text-[#ffd700]">SECTOR {String(s.num).padStart(2, '0')}</span>
                </div>
                <div className="p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#79b9f1] mb-2">{s.terrain}</p>
                  <h3 className="font-black text-base text-[#f2ead2]">{s.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#b0bdc6]">{s.briefing}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <EquipmentGuide />

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
