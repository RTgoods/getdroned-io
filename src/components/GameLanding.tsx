'use client'

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

export function GameLanding({ game, hasPurchased, onPlay }: Props) {
  const price = game.price_cents > 0
    ? `$${(game.price_cents / 100).toFixed(2)}`
    : 'FREE'

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: '#0c0d0b',
      color: '#e8e4d8',
    }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '52vh', minHeight: 320, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/get-droned/assets/images/covers/main-cover.webp"
          alt="Get Droned"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
        {/* Gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #0c0d0b 0%, rgba(12,13,11,0.5) 50%, rgba(12,13,11,0.1) 100%)',
        }} />
        {/* Scan lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }} />

        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 36px 32px' }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#c0562f', marginBottom: 8 }}>
            Slava Ukraini
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900,
            letterSpacing: '6px', textTransform: 'uppercase',
            color: '#f2ead2', textShadow: '0 4px 0 #1a160e',
            margin: 0, lineHeight: 1,
          }}>
            GET DRONED
          </h1>
          <p style={{ marginTop: 10, fontSize: 12, letterSpacing: '2px', color: '#9a9288', textTransform: 'uppercase', maxWidth: 480 }}>
            {game.tagline ?? 'Six sectors of aerial combat. No installs. No mercy.'}
          </p>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 36px 60px' }}>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          paddingTop: 28, paddingBottom: 28,
          borderBottom: '1px solid rgba(226,177,60,0.12)',
        }}>
          <button
            onClick={onPlay}
            style={{
              background: 'linear-gradient(180deg,#c0562f,#7d3016)',
              color: '#fff', border: 'none', borderRadius: 3,
              padding: '12px 28px', fontWeight: 900, fontSize: 11,
              letterSpacing: '3px', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 3px 0 #4a1b0c',
              transition: 'filter 120ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            ▶ DEPLOY NOW
          </button>

          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e2b13c', letterSpacing: '1px' }}>
              {price}
            </div>
            {game.price_cents > 0 && (
              <div style={{ fontSize: 9, color: '#6e6a60', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>
                {hasPurchased ? 'OWNED · ONE-TIME PURCHASE' : 'ONE-TIME PURCHASE · NO SUBSCRIPTION'}
              </div>
            )}
            {/* Ukraine donation badge */}
            {game.price_cents > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                background: 'rgba(0,87,183,0.15)', border: '1px solid rgba(0,87,183,0.35)',
                borderRadius: 3, padding: '4px 8px',
              }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>🇺🇦</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b9fd4' }}>
                  50% TO UKRAINE RELIEF
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── ABOUT ────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 28, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#e2b13c', marginBottom: 12 }}>
            ABOUT THIS GAME
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.8, color: '#9a9288', maxWidth: 580 }}>
            {game.long_description ?? game.description ?? 'A fast-paced browser shooter with six escalating levels of drone warfare. Take command and battle through uniquely themed sectors — compound raids, trench warfare, naval combat, oil field strikes, airfield assaults, and a final confrontation at Red Square.'}
          </p>
        </div>

        {/* ── SECTOR INTEL ─────────────────────────────────────────── */}
        <div style={{ paddingTop: 28, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#e2b13c', marginBottom: 16 }}>
            SECTOR INTEL
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {SECTORS.map((s) => (
              <div
                key={s.num}
                style={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '16/9' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.cover}
                  alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.85) contrast(1.05)' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(12,13,11,0.9) 0%, rgba(12,13,11,0.2) 60%, transparent 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '6px 8px' }}>
                  <div style={{ fontSize: 6, fontWeight: 900, letterSpacing: '2px', color: '#c0562f', textTransform: 'uppercase' }}>
                    SECTOR {s.num}
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 900, color: '#f2ead2', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 1 }}>
                    {s.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SPECS ────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 28 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#e2b13c', marginBottom: 16 }}>
            MISSION SPECS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {SPECS.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#6e6a60', textTransform: 'uppercase' }}>
                  {label}
                </span>
                <span style={{ fontSize: 10, color: '#a9a396' }}>
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
