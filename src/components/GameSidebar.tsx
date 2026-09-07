'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface Props {
  game: Game
  user: User | null
  hasPurchased: boolean
  completedSectors?: number[]
  playing?: boolean
  onPlay?: () => void
  onBack?: () => void
  onReset?: () => void
}

const W_OPEN = 232
const W_CLOSED = 52

// Ukraine palette
const UA = {
  blue:       '#0068cc',
  blueMid:    '#4a9eff',
  blueLight:  '#7bbeff',
  blueDim:    'rgba(0,104,204,0.18)',
  blueFaint:  'rgba(0,104,204,0.08)',
  yellow:     '#ffd700',
  yellowDim:  'rgba(255,215,0,0.18)',
  yellowFaint:'rgba(255,215,0,0.07)',
  bg:         '#09101f',
  surface:    '#0f1828',
  border:     'rgba(0,104,204,0.16)',
  borderFaint:'rgba(0,104,204,0.08)',
  textPrimary:'#d8e8ff',
  textMuted:  '#4a6080',
  textDim:    '#243040',
  locked:     '#1e2a3a',
}

const SECTORS = [
  { num: 1, name: 'FRANKS AND HAMMERS', cover: '/get-droned/assets/images/covers/level-1.png?v=2' },
  { num: 2, name: 'THE TRENCHES',   cover: '/get-droned/assets/images/covers/level-2.png?v=1' },
  { num: 3, name: 'THE BLACK SEA',  cover: '/get-droned/assets/images/covers/level-3.png?v=1' },
  { num: 4, name: 'THE OIL FIELDS', cover: '/get-droned/assets/images/covers/level-4.png?v=1' },
  { num: 5, name: 'THE AIRFIELD',   cover: '/get-droned/assets/images/covers/level-5.png?v=2' },
  { num: 6, name: 'RED SQUARE',     cover: '/get-droned/assets/images/covers/level-6.png?v=1' },
]

export function GameSidebar({ game, user, hasPurchased, completedSectors = [], playing = false, onPlay, onBack, onReset }: Props) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedSector, setExpandedSector] = useState<number | null>(null)
  const supabase = createClient()
  const price = `$${(game.price_cents / 100).toFixed(2)}`

  useEffect(() => {
    const isMob = window.innerWidth < 768
    setMobile(isMob)
    if (!isMob) {
      const saved = localStorage.getItem('sidebar')
      setOpen(saved !== 'closed')
    }
    setMounted(true)
    const check = () => {
      const mob = window.innerWidth < 768
      setMobile(mob)
      if (mob) setOpen(false)
    }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggle = () => {
    setOpen((v) => {
      if (!mobile) localStorage.setItem('sidebar', v ? 'closed' : 'open')
      return !v
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'
  const emailShort = user?.email
    ? user.email.length > 20 ? user.email.slice(0, 17) + '…' : user.email
    : null

  const isMobileOpen = mobile && open
  const sideWidth = !mounted ? 0 : mobile ? (open ? W_OPEN : 0) : open ? W_OPEN : W_CLOSED
  const sideMin   = sideWidth

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={toggle}
          style={{ background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(3px)' }}
        />
      )}

      <aside
        style={{
          width: sideWidth,
          minWidth: sideMin,
          transition: mounted ? 'width 220ms cubic-bezier(.4,0,.2,1), min-width 220ms cubic-bezier(.4,0,.2,1)' : 'none',
          background: UA.bg,
          borderRight: `1px solid ${UA.border}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: mobile ? 'fixed' : 'relative',
          top: 0, left: 0,
          zIndex: mobile ? 50 : 'auto',
          flexShrink: 0,
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center',
          padding: '0 13px', gap: 12,
          borderBottom: `1px solid ${UA.border}`,
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(0,80,180,0.10) 0%, transparent 100%)',
        }}>
          <button
            onClick={toggle}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: UA.textMuted, display: 'flex', flexDirection: 'column', gap: 4.5, flexShrink: 0,
            }}
          >
            <span style={{ display: 'block', width: 18, height: 1.5, background: 'currentColor' }} />
            <span style={{ display: 'block', width: 12, height: 1.5, background: 'currentColor' }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: 'currentColor' }} />
          </button>
          {open && (
            <Link href="/" style={{ fontWeight: 900, letterSpacing: '3px', fontSize: 11,
              color: UA.textPrimary, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              GET DRONED
              <span style={{ display: 'block', fontSize: 7, letterSpacing: '2.5px', color: UA.yellow, marginTop: 2, fontWeight: 700 }}>
                Slava Ukraini
              </span>
            </Link>
          )}
        </div>

        {/* ── Player ───────────────────────────────────────── */}
        <SideRow
          open={open}
          icon={
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: `linear-gradient(135deg, ${UA.blue} 0%, #003d80 100%)`,
              border: `1px solid ${UA.blueMid}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
          }
          label={
            user ? (
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.yellow, textTransform: 'uppercase' }}>PILOT</div>
                <div style={{ fontSize: 10, color: UA.textMuted, marginTop: 2 }}>{emailShort}</div>
              </div>
            ) : (
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.textMuted, textTransform: 'uppercase' }}>NOT SIGNED IN</div>
            )
          }
          border
        />

        {/* ── Sectors label ────────────────────────────────── */}
        {open ? (
          <div style={{
            padding: '10px 14px 6px',
            borderBottom: `1px solid ${UA.borderFaint}`,
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              display: 'inline-block', width: 12, height: 2,
              background: UA.yellow, borderRadius: 1,
            }} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>
              SECTORS
            </span>
          </div>
        ) : (
          <div style={{ height: 1, background: UA.borderFaint, flexShrink: 0 }} />
        )}

        {/* ── Level list (scrollable) ───────────────────────── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {SECTORS.map((s) => {
            const unlocked = s.num === 1 || hasPurchased
            const done = completedSectors.includes(s.num)
            return (
              <LevelRow
                key={s.num}
                sector={s}
                unlocked={unlocked}
                done={done}
                open={open}
                expanded={expandedSector === s.num}
                onToggle={() => setExpandedSector(prev => prev === s.num ? null : s.num)}
                onPlay={() => { if (unlocked) { if (mobile) setOpen(false); onPlay?.() } }}
                price={price}
                hasUser={!!user}
              />
            )
          })}

          {!hasPurchased && !open && (
            <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: UA.textDim }}>◼</span>
            </div>
          )}

          {!hasPurchased && open && (
            <div style={{
              margin: '8px 10px',
              padding: '10px 12px',
              background: UA.blueFaint,
              border: `1px solid ${UA.blueDim}`,
              borderRadius: 4,
            }}>
              <div style={{
                fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                color: UA.yellow, textTransform: 'uppercase', marginBottom: 4,
              }}>
                UNLOCK ALL SECTORS
              </div>
              <div style={{ fontSize: 9, color: UA.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                ${(game.price_cents / 100).toFixed(2)} · One-Time · 100% To Ukraine
              </div>
              <a id="sidebar-unlock-btn" href="/auth/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, textAlign: 'center', fontSize: 8, fontWeight: 900,
                letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none',
                padding: '6px 0', borderRadius: 3,
                background: `linear-gradient(180deg, ${UA.yellow} 0%, #c8a000 100%)`,
                color: '#0a1000',
              }}>
                🇺🇦 BUY ACCESS
              </a>
            </div>
          )}
        </div>

        {/* ── Playing indicator ────────────────────────────── */}
        {playing && (
          <SideRow
            open={open}
            onClick={onBack}
            icon={<span style={{ fontSize: 12, color: UA.yellow, flexShrink: 0 }}>↩</span>}
            label={
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.yellow, textTransform: 'uppercase' }}>NOW PLAYING</div>
                <div style={{ fontSize: 9, color: UA.textMuted, letterSpacing: '1px', marginTop: 1, textTransform: 'uppercase' }}>← BACK TO INFO</div>
              </div>
            }
            hover
            border
          />
        )}

        {/* ── Fullscreen ───────────────────────────────────── */}
        {game.play_url && (
          <SideRow
            open={open}
            href={game.play_url}
            target="_blank"
            icon={<span style={{ fontSize: 13, color: UA.textMuted, flexShrink: 0 }}>↗</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.textMuted, textTransform: 'uppercase' }}>FULLSCREEN</span>}
            hover
            border
          />
        )}

        {/* ── Reset progress ────────────────────────────────── */}
        {user && hasPurchased && onReset && (
          <SideRow
            open={open}
            onClick={() => { if (confirm('Reset all sector progress and start from Sector 1?')) onReset() }}
            icon={<span style={{ fontSize: 11, color: UA.textDim, flexShrink: 0 }}>↺</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.textDim, textTransform: 'uppercase' }}>RESET PROGRESS</span>}
            hover
            border
          />
        )}

        {/* ── Sign in / out ────────────────────────────────── */}
        {user ? (
          <SideRow
            open={open}
            onClick={signOut}
            icon={<span style={{ fontSize: 12, color: UA.textMuted, flexShrink: 0 }}>→</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.textMuted, textTransform: 'uppercase' }}>SIGN OUT</span>}
            hover
          />
        ) : (
          <SideRow
            open={open}
            href="/auth/login"
            icon={<span style={{ fontSize: 12, color: UA.blueMid, flexShrink: 0 }}>→</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase' }}>SIGN IN</span>}
            hover
          />
        )}

        {/* ── Bottom flag stripe ───────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${UA.blue} 0%, ${UA.blueMid} 100%)` }} />
          <div style={{ height: 3, background: `linear-gradient(90deg, ${UA.yellow} 0%, #f5c800 100%)` }} />
        </div>
      </aside>

      {/* Mobile hamburger */}
      {mobile && !open && mounted && (
        <button
          onClick={toggle}
          aria-label="Open menu"
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 60,
            background: `rgba(9,16,31,0.94)`,
            border: `1px solid ${UA.blueDim}`,
            borderRadius: 4, width: 36, height: 36,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ width: 14, height: 1.5, background: UA.textMuted, display: 'block' }} />
          <span style={{ width: 10, height: 1.5, background: UA.textMuted, display: 'block' }} />
          <span style={{ width: 14, height: 1.5, background: UA.textMuted, display: 'block' }} />
        </button>
      )}
    </>
  )
}

// Per-sector objectives
const OBJECTIVES: Record<number, string[]> = {
  1: ['Breach 3 compound perimeters', 'Neutralize enemy forces', 'Eliminate Level One Boss'],
  2: ['Push through enemy trenches', 'Clear the front-line network', 'Secure the trench boss'],
  3: ['Establish naval dominance', 'Destroy the Black Sea fleet', 'Defeat the sea commander'],
  4: ['Disrupt enemy supply lines', 'Destroy oil infrastructure', 'Take out the field boss'],
  5: ['Suppress air defenses', 'Ground the enemy air force', 'Neutralize the airfield boss'],
  6: ['Breach the inner circle', 'Push to Red Square', 'Final confrontation — finish it'],
}

// ── Level row ─────────────────────────────────────────────────────────────────
interface LevelRowProps {
  sector: { num: number; name: string; cover: string }
  unlocked: boolean
  done: boolean
  open: boolean
  expanded: boolean
  onToggle: () => void
  onPlay: () => void
  price: string
  hasUser: boolean
}

function LevelRow({ sector, unlocked, done, open, expanded, onToggle, onPlay, price, hasUser }: LevelRowProps) {
  const [hovered, setHovered] = useState(false)
  const objectives = OBJECTIVES[sector.num] ?? []

  // Pill: done=yellow, unlocked/active=blue, locked-idle=dim
  const active = expanded || unlocked
  const pillBg    = done ? UA.yellowFaint : active ? UA.blueFaint  : 'rgba(255,255,255,0.02)'
  const pillBdr   = done ? 'rgba(255,215,0,0.45)' : active ? UA.blueDim : 'rgba(255,255,255,0.05)'
  const pillColor = done ? UA.yellow      : active ? UA.blueMid    : UA.textDim

  return (
    <div style={{ borderBottom: `1px solid ${UA.borderFaint}` }}>
      {/* Row header — click to toggle objectives accordion */}
      <button
        onClick={open ? onToggle : (unlocked ? onPlay : undefined)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={!unlocked ? `Buy to unlock Sector ${sector.num}` : done ? `Sector ${sector.num} complete` : `Sector ${sector.num} — ${sector.name}`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: open ? 10 : 0, padding: open ? '7px 12px' : '7px 0',
          background: hovered ? 'rgba(0,104,204,0.06)' : expanded ? 'rgba(0,104,204,0.05)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 140ms',
          textAlign: 'left',
          justifyContent: open ? 'flex-start' : 'center',
        }}
      >
        {/* Number/status pill */}
        <div style={{
          width: 28, height: 28, borderRadius: 2, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: pillBg, border: `1px solid ${pillBdr}`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: pillColor, letterSpacing: '0.5px' }}>
            {done ? '✓' : `S${sector.num}`}
          </span>
          {!open && !unlocked && <span style={{ fontSize: 7, marginTop: 1, color: UA.textDim }}>◼</span>}
          {!open && unlocked && !done && <span style={{ fontSize: 7, color: UA.blueMid, marginTop: 1 }}>▶</span>}
        </div>

        {open && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontSize: 7, fontWeight: 900, letterSpacing: '1.5px',
              color: done ? UA.yellow : active ? UA.blueMid : UA.textDim,
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              {done ? '✓ CLEARED' : `SECTOR ${sector.num}`}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '1px',
              color: done ? 'rgba(255,215,0,0.7)' : active ? UA.textPrimary : UA.textDim,
              textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {sector.name}
            </div>
          </div>
        )}

        {/* Chevron expand indicator */}
        {open && (
          <div style={{ flexShrink: 0, width: 16, textAlign: 'center', transition: 'transform 200ms', transform: expanded ? 'rotate(90deg)' : 'none' }}>
            <span style={{ fontSize: 9, color: expanded ? UA.blueMid : UA.textMuted, transition: 'color 140ms' }}>▶</span>
          </div>
        )}
      </button>

      {/* Objectives panel — accordion */}
      {open && expanded && (
        <div style={{
          padding: '6px 12px 10px 50px',
          background: 'rgba(0,60,120,0.04)',
          borderTop: `1px solid ${UA.borderFaint}`,
        }}>
          {objectives.map((obj, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 6,
              marginBottom: i < objectives.length - 1 ? 5 : 10,
            }}>
              <span style={{
                flexShrink: 0, marginTop: 1, fontSize: 8, fontWeight: 900,
                color: done ? UA.yellow : UA.textMuted,
              }}>
                {done ? '✓' : '○'}
              </span>
              <span style={{
                fontSize: 8, letterSpacing: '0.5px', lineHeight: 1.4,
                color: done ? 'rgba(255,215,0,0.6)' : '#5a7090',
                textDecoration: done ? 'line-through' : 'none',
                textTransform: 'capitalize',
              }}>
                {obj}
              </span>
            </div>
          ))}
          {/* Play / Unlock button */}
          {unlocked ? (
            <button
              onClick={onPlay}
              style={{
                marginTop: 2, width: '100%', padding: '5px 0',
                background: done
                  ? `linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.08) 100%)`
                  : `linear-gradient(180deg, ${UA.blue} 0%, #004a99 100%)`,
                border: `1px solid ${done ? 'rgba(255,215,0,0.3)' : UA.blueDim}`,
                borderRadius: 3, cursor: 'pointer',
                fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                color: done ? UA.yellow : '#e8f4ff',
                textTransform: 'uppercase',
                transition: 'filter 140ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              {done ? '↺ REPLAY' : '▶ PLAY'}
            </button>
          ) : (
            <a
              href={hasUser ? '#unlock' : '/auth/login'}
              onClick={hasUser ? (e) => { e.preventDefault(); document.getElementById('sidebar-unlock-btn')?.click() } : undefined}
              style={{
                marginTop: 4, display: 'block', width: '100%', padding: '6px 0',
                background: `linear-gradient(180deg, #f5c800 0%, #c89e00 100%)`,
                border: '1px solid rgba(245,200,0,0.4)',
                borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                color: '#1a1000', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'filter 140ms',
                boxSizing: 'border-box' as const,
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              🇺🇦 UNLOCK ALL · {price}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Generic row ───────────────────────────────────────────────────────────────
interface RowProps {
  open: boolean
  icon: React.ReactNode
  label: React.ReactNode
  href?: string
  target?: string
  onClick?: () => void
  border?: boolean
  hover?: boolean
}

function SideRow({ open, icon, label, href, target, onClick, border, hover }: RowProps) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 13px',
    cursor: href || onClick ? 'pointer' : 'default',
    borderTop: border ? `1px solid ${UA.borderFaint}` : undefined,
    textDecoration: 'none', transition: 'background 150ms',
    minHeight: 44, flexShrink: 0,
  }

  const content = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, flexShrink: 0 }}>
        {icon}
      </span>
      {open && <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{label}</span>}
    </>
  )

  const hoverHandlers = hover ? {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,104,204,0.07)' },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = 'transparent' },
  } : {}

  if (href) return <a href={href} target={target} style={style} {...hoverHandlers}>{content}</a>
  if (onClick) return <button onClick={onClick} style={{ ...style, background: 'none', border: 'none', width: '100%', textAlign: 'left' }} {...hoverHandlers}>{content}</button>
  return <div style={style}>{content}</div>
}
