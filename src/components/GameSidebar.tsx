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
  playing?: boolean
  onPlay?: () => void
  onBack?: () => void
}

const W_OPEN = 232
const W_CLOSED = 52

const SECTORS = [
  { num: 1, name: 'THE COMPOUND',   cover: '/get-droned/assets/images/covers/level-1.webp' },
  { num: 2, name: 'THE TRENCHES',   cover: '/get-droned/assets/images/covers/level-2.webp' },
  { num: 3, name: 'THE BLACK SEA',  cover: '/get-droned/assets/images/covers/level-3.webp' },
  { num: 4, name: 'THE OIL FIELDS', cover: '/get-droned/assets/images/covers/level-4.webp' },
  { num: 5, name: 'THE AIRFIELD',   cover: '/get-droned/assets/images/covers/level-5.webp' },
  { num: 6, name: 'RED SQUARE',     cover: '/get-droned/assets/images/covers/level-6-red-square.webp' },
]

export function GameSidebar({ game, user, hasPurchased, playing = false, onPlay, onBack }: Props) {
  const [open, setOpen] = useState(true)
  const [mobile, setMobile] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('sidebar')
    if (saved === 'closed') setOpen(false)
  }, [])

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem('sidebar', v ? 'closed' : 'open')
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

  const handleLevelClick = (num: number) => {
    const unlocked = num === 1 || hasPurchased
    if (unlocked) onPlay?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={toggle}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: mobile ? (open ? W_OPEN : 0) : open ? W_OPEN : W_CLOSED,
          minWidth: mobile ? (open ? W_OPEN : 0) : open ? W_OPEN : W_CLOSED,
          transition: 'width 220ms cubic-bezier(.4,0,.2,1), min-width 220ms cubic-bezier(.4,0,.2,1)',
          background: '#141610',
          borderRight: '1px solid rgba(226,177,60,0.12)',
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
          borderBottom: '1px solid rgba(226,177,60,0.10)',
          flexShrink: 0,
        }}>
          <button
            onClick={toggle}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: '#6e6a60', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}
          >
            <span style={{ display: 'block', width: 18, height: 1.5, background: 'currentColor' }} />
            <span style={{ display: 'block', width: 12, height: 1.5, background: 'currentColor' }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: 'currentColor' }} />
          </button>
          {open && (
            <Link href="/" style={{ fontWeight: 900, letterSpacing: '3px', fontSize: 11,
              color: '#f2ead2', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              GET DRONED
              <span style={{ display: 'block', fontSize: 7, letterSpacing: '2px', color: '#c0562f', marginTop: 1 }}>
                Slava Ukraini
              </span>
            </Link>
          )}
        </div>

        {/* ── Player ───────────────────────────────────────── */}
        <SideRow
          open={open}
          icon={
            <div style={{ width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg,#2a3020,#1a1c14)',
              border: '1px solid rgba(226,177,60,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: '#e2b13c', flexShrink: 0 }}>
              {initials}
            </div>
          }
          label={
            user ? (
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#9db35a', textTransform: 'uppercase' }}>PILOT</div>
                <div style={{ fontSize: 10, color: '#a9a396', marginTop: 2 }}>{emailShort}</div>
              </div>
            ) : (
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#6e6a60', textTransform: 'uppercase' }}>NOT SIGNED IN</div>
            )
          }
          border
        />

        {/* ── Sectors label ────────────────────────────────── */}
        {open ? (
          <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#e2b13c', textTransform: 'uppercase' }}>
              SECTORS
            </span>
          </div>
        ) : (
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
        )}

        {/* ── Level list (scrollable) ───────────────────────── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {SECTORS.map((s) => {
            const unlocked = s.num === 1 || hasPurchased
            return (
              <LevelRow
                key={s.num}
                sector={s}
                unlocked={unlocked}
                open={open}
                onClick={() => handleLevelClick(s.num)}
              />
            )
          })}

          {/* Buy prompt when collapsed — subtle lock icon */}
          {!hasPurchased && !open && (
            <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#4a4840' }}>◼</span>
            </div>
          )}

          {/* Buy prompt when expanded */}
          {!hasPurchased && open && (
            <div style={{
              margin: '8px 10px',
              padding: '8px 10px',
              background: 'rgba(226,177,60,0.06)',
              border: '1px solid rgba(226,177,60,0.16)',
              borderRadius: 3,
            }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '2px', color: '#e2b13c', textTransform: 'uppercase', marginBottom: 4 }}>
                UNLOCK ALL SECTORS
              </div>
              <div style={{ fontSize: 9, color: '#6e6a60', marginBottom: 6, lineHeight: 1.5 }}>
                ${(game.price_cents / 100).toFixed(2)} · one-time purchase
              </div>
              <a href="/auth/login" style={{
                display: 'block', textAlign: 'center', fontSize: 8, fontWeight: 900,
                letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none',
                padding: '5px 0', borderRadius: 2,
                background: 'linear-gradient(180deg,#c0562f,#7d3016)',
                color: '#fff',
              }}>
                BUY · 🇺🇦 50% TO UKRAINE
              </a>
            </div>
          )}
        </div>

        {/* ── Playing indicator ────────────────────────────── */}
        {playing && (
          <SideRow
            open={open}
            onClick={onBack}
            icon={<span style={{ fontSize: 12, color: '#a9a396', flexShrink: 0 }}>↩</span>}
            label={
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#9db35a', textTransform: 'uppercase' }}>NOW PLAYING</div>
                <div style={{ fontSize: 9, color: '#6e6a60', letterSpacing: '1px', marginTop: 1, textTransform: 'uppercase' }}>← BACK TO INFO</div>
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
            icon={<span style={{ fontSize: 13, color: '#6e6a60', flexShrink: 0 }}>↗</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#6e6a60', textTransform: 'uppercase' }}>FULLSCREEN</span>}
            hover
            border
          />
        )}

        {/* ── Sign in / out ────────────────────────────────── */}
        {user ? (
          <SideRow
            open={open}
            onClick={signOut}
            icon={<span style={{ fontSize: 12, color: '#6e6a60', flexShrink: 0 }}>→</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#6e6a60', textTransform: 'uppercase' }}>SIGN OUT</span>}
            hover
          />
        ) : (
          <SideRow
            open={open}
            href="/auth/login"
            icon={<span style={{ fontSize: 12, color: '#c0562f', flexShrink: 0 }}>→</span>}
            label={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#c0562f', textTransform: 'uppercase' }}>SIGN IN</span>}
            hover
          />
        )}

        <div style={{ height: 10 }} />
      </aside>

      {/* Mobile hamburger tab */}
      {mobile && !open && (
        <button
          onClick={toggle}
          aria-label="Open sidebar"
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 60,
            background: 'rgba(20,22,16,0.92)',
            border: '1px solid rgba(226,177,60,0.18)',
            borderRadius: 4, width: 36, height: 36,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ width: 14, height: 1.5, background: '#a9a396', display: 'block' }} />
          <span style={{ width: 10, height: 1.5, background: '#a9a396', display: 'block' }} />
          <span style={{ width: 14, height: 1.5, background: '#a9a396', display: 'block' }} />
        </button>
      )}
    </>
  )
}

// ── Level row ─────────────────────────────────────────────────────────────────
interface LevelRowProps {
  sector: { num: number; name: string; cover: string }
  unlocked: boolean
  open: boolean
  onClick: () => void
}

function LevelRow({ sector, unlocked, open, onClick }: LevelRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!unlocked ? `Buy to unlock Sector ${sector.num}` : `Play Sector ${sector.num} — ${sector.name}`}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        gap: open ? 10 : 0, padding: open ? '7px 12px' : '7px 0',
        background: hovered && unlocked ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
        cursor: unlocked ? 'pointer' : 'default',
        transition: 'background 140ms',
        textAlign: 'left',
        justifyContent: open ? 'flex-start' : 'center',
      }}
    >
      {/* Number pill — both expanded and collapsed */}
      {open ? (
        <div style={{
          width: 28, height: 28, borderRadius: 2, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: unlocked ? 'rgba(157,179,90,0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${unlocked ? 'rgba(157,179,90,0.25)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: unlocked ? '#9db35a' : '#3a3830', letterSpacing: '0.5px' }}>
            S{sector.num}
          </span>
        </div>
      ) : (
        /* Collapsed: number pill */
        <div style={{
          width: 28, height: 28, borderRadius: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: unlocked ? 'rgba(157,179,90,0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${unlocked ? 'rgba(157,179,90,0.25)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: unlocked ? '#9db35a' : '#3a3830', letterSpacing: '0.5px' }}>
            S{sector.num}
          </span>
          {!unlocked && <span style={{ fontSize: 7, marginTop: 1 }}>◼</span>}
          {unlocked && sector.num === 1 && <span style={{ fontSize: 7, color: '#9db35a', marginTop: 1 }}>▶</span>}
        </div>
      )}

      {/* Label (expanded only) */}
      {open && (
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            fontSize: 7, fontWeight: 900, letterSpacing: '1.5px',
            color: unlocked ? '#c0562f' : '#3a3830',
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            SECTOR {sector.num}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 900, letterSpacing: '1px',
            color: unlocked ? '#d8d0bc' : '#3a3830',
            textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {sector.name}
          </div>
        </div>
      )}

      {/* Right: play arrow or lock */}
      {open && (
        <div style={{ flexShrink: 0, width: 16, textAlign: 'center' }}>
          {unlocked ? (
            <span style={{ fontSize: 10, color: hovered ? '#9db35a' : '#4a5640', transition: 'color 140ms' }}>▶</span>
          ) : (
            <span style={{ fontSize: 10, color: '#3a3830' }}>◼</span>
          )}
        </div>
      )}
    </button>
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
    borderTop: border ? '1px solid rgba(255,255,255,0.04)' : undefined,
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
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = 'transparent' },
  } : {}

  if (href) return <a href={href} target={target} style={style} {...hoverHandlers}>{content}</a>
  if (onClick) return <button onClick={onClick} style={{ ...style, background: 'none', border: 'none', width: '100%', textAlign: 'left' }} {...hoverHandlers}>{content}</button>
  return <div style={style}>{content}</div>
}
