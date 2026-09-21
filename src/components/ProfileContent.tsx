'use client'

import { useState, useCallback, useEffect } from 'react'
import { GameSidebar } from './GameSidebar'
import { AvatarSelector, AvatarBadge, ALL_KITS } from './AvatarSelector'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { SectorStat } from '@/app/api/progress/route'

interface Props {
  game: Game
  user: User
  hasPurchased: boolean
  isAdmin: boolean
  completedSectors: number[]
  sectorStats: Record<string, SectorStat>
  avatarUrl: string | null
  onReturnToGame?: () => void
  gameId: string | null
}

const UA = {
  bg:      '#09101f',
  surface: '#0f1828',
  border:  'rgba(0,104,204,0.16)',
  borderFaint: 'rgba(0,104,204,0.08)',
  yellow:  '#ffd700',
  blue:    '#0068cc',
  blueMid: '#4a9eff',
  text:    '#d8e8ff',
  muted:   '#4a6080',
  dim:     '#243040',
  green:   '#9db35a',
}

const SECTOR_NAMES: Record<number, string> = {
  1: 'FRANKS AND HAMMERS',
  2: 'MEAT GRINDER',
  3: 'BLACK SEA FLEET',
  4: 'CRUDE INTENTIONS',
  5: 'MILITARY AID',
  6: 'RED SQUARE',
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export function ProfileContent({ game, user, hasPurchased, isAdmin, completedSectors, sectorStats, avatarUrl: initialAvatarUrl, gameId, onReturnToGame }: Props) {
  const totalKills = Object.values(sectorStats).reduce((s, x) => s + (x.kills ?? 0), 0)
  const totalTime  = Object.values(sectorStats).reduce((s, x) => s + (x.timeAlive ?? 0), 0)
  const totalSquad = Object.values(sectorStats).reduce((s, x) => s + (x.squadLost ?? 0), 0)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [musicMuted, setMusicMuted] = useState(false)
  const [autoAim, setAutoAim] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  useEffect(() => {
    setMusicMuted(localStorage.getItem('gd_muted') === '1')
    setAutoAim((localStorage.getItem('gd_autoAim') ?? localStorage.getItem('gd_autoFire')) === '1')
  }, [])

  const handleSave = useCallback(async (kitId: string) => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: kitId }),
      })
      if (res.ok) {
        setAvatarUrl(kitId)
        setSaveMsg('SAVED')
        setTimeout(() => setSaveMsg(null), 2000)
      } else {
        setSaveMsg('ERROR')
        setTimeout(() => setSaveMsg(null), 3000)
      }
    } catch {
      setSaveMsg('ERROR')
      setTimeout(() => setSaveMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [])

  const kit = ALL_KITS.find(k => k.id === avatarUrl)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: UA.bg }}>
      {!onReturnToGame && <GameSidebar
        game={game}
        user={user}
        hasPurchased={hasPurchased}
        isAdmin={isAdmin}
        completedSectors={completedSectors}
        sectorStats={sectorStats}
        avatarUrl={avatarUrl}
      />}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflowY: 'auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Back to game */}
          <div style={{ marginBottom: 24 }}>
            <a
              href="/"
              onClick={onReturnToGame ? (event) => { event.preventDefault(); onReturnToGame() } : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 8, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
                color: UA.muted, textDecoration: 'none',
                padding: '7px 14px', borderRadius: 3,
                border: `1px solid ${UA.borderFaint}`,
                background: UA.surface,
                transition: 'color 150ms, border-color 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = UA.yellow; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = UA.muted; (e.currentTarget as HTMLElement).style.borderColor = UA.borderFaint }}
            >
              {onReturnToGame ? '▶ RESUME GAME' : '← BACK TO GAME'}
            </a>
          </div>

          {/* Title row */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.yellow, borderRadius: 1 }} />
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>PILOT FILE</span>
            </div>

            {/* Avatar + title side by side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 8, flexShrink: 0,
                border: `2px solid ${kit ? UA.yellow : 'rgba(0,104,204,0.35)'}`,
                background: UA.surface,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {kit
                  ? <AvatarBadge kitId={avatarUrl} size={80} />
                  : <span style={{ fontSize: 22, fontWeight: 900, color: UA.muted }}>
                      {(user.email?.[0] ?? '?').toUpperCase()}
                    </span>
                }
              </div>

              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '5px', textTransform: 'uppercase', color: UA.text, margin: 0 }}>
                  COMBAT RECORD
                </h1>
                <p style={{ marginTop: 4, fontSize: 10, letterSpacing: '1.5px', color: UA.muted }}>{user.email}</p>
                {kit && (
                  <p style={{ marginTop: 3, fontSize: 7, letterSpacing: '2px', fontWeight: 900, color: UA.blue, textTransform: 'uppercase' }}>
                    PILOT · {kit.label}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 28 }}>
            {[
              { label: 'SECTORS CLEARED', value: `${completedSectors.length}/6` },
              { label: 'TOTAL KILLS',     value: String(totalKills) },
              { label: 'TIME ON TARGET',  value: fmtTime(totalTime) },
              { label: 'SQUAD LOST',      value: String(totalSquad) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '12px 14px',
                background: UA.surface,
                border: `1px solid ${UA.border}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 6, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: UA.yellow }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Avatar selector — collapsible */}
          <div style={{ marginBottom: 28, background: UA.surface, border: `1px solid ${UA.border}`, borderRadius: 4, overflow: 'hidden' }}>
            {/* Header / toggle */}
            <button
              onClick={() => setAvatarOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 10, height: 2, background: UA.yellow, borderRadius: 1 }} />
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>CHOOSE PILOT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {saveMsg && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, letterSpacing: '2px',
                    color: saveMsg === 'SAVED' ? UA.green : '#e04b3c',
                    textTransform: 'uppercase',
                  }}>{saveMsg}</span>
                )}
                <span style={{
                  fontSize: 10, color: UA.muted,
                  transform: avatarOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                }}>▾</span>
              </div>
            </button>

            {/* Body */}
            {avatarOpen && (
              <div style={{ padding: '0 20px 18px' }}>
                <AvatarSelector current={avatarUrl} onSave={handleSave} saving={saving} />
              </div>
            )}
          </div>

          {/* Pilot Settings — music + reset */}
          <div style={{ marginBottom: 28, background: UA.surface, border: `1px solid ${UA.border}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${UA.borderFaint}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 10, height: 2, background: UA.yellow, borderRadius: 1 }} />
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>PILOT SETTINGS</span>
            </div>

            <button type="button" role="switch" aria-checked={autoAim} aria-label="Auto Aim"
              onClick={() => { const next = !autoAim; setAutoAim(next); localStorage.setItem('gd_autoAim', next ? '1' : '0') }}
              style={{ width: '100%', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'none', border: 'none', borderBottom: `1px solid ${UA.borderFaint}`, color: UA.yellow, cursor: 'pointer', textAlign: 'left' }}>
              <span><strong>AUTO AIM</strong><span style={{ display: 'block', fontSize: 11, color: '#b0bdc6', marginTop: 5 }}>Aim at the closest visible enemy. Press FIRE to shoot. Off: aim manually. Saved on this device.</span></span>
              <strong>{autoAim ? 'ON' : 'OFF'}</strong>
            </button>

            {/* Music toggle */}
            <button
              onClick={() => {
                const next = !musicMuted
                setMusicMuted(next)
                localStorage.setItem('gd_muted', next ? '1' : '0')
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: 'none', border: 'none',
                borderBottom: `1px solid ${UA.borderFaint}`, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, color: musicMuted ? UA.dim : UA.muted }}>{musicMuted ? '✕' : '♪'}</span>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: musicMuted ? UA.dim : UA.text, textTransform: 'uppercase' }}>
                  MUSIC {musicMuted ? 'OFF' : 'ON'}
                </span>
              </div>
              <div style={{
                width: 34, height: 18, borderRadius: 9,
                background: musicMuted ? 'rgba(255,255,255,0.08)' : `rgba(0,104,204,0.35)`,
                border: `1px solid ${musicMuted ? 'rgba(255,255,255,0.1)' : 'rgba(0,104,204,0.5)'}`,
                position: 'relative', transition: 'background 200ms, border-color 200ms', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  left: musicMuted ? 2 : 16,
                  width: 12, height: 12, borderRadius: '50%',
                  background: musicMuted ? UA.dim : UA.blueMid,
                  transition: 'left 200ms, background 200ms',
                }} />
              </div>
            </button>

            {/* Reset progress */}
            {hasPurchased && gameId && (
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.yellow, textTransform: 'uppercase', marginBottom: 3 }}>RESET PROGRESS</div>
                  <div style={{ fontSize: 8, color: UA.text, letterSpacing: '0.5px' }}>Erase all sector data and restart from Sector 1</div>
                </div>
                <button
                  disabled={resetting}
                  onClick={async () => {
                    if (!confirm('Reset all sector progress and start from Sector 1?')) return
                    setResetting(true)
                    setResetMsg(null)
                    try {
                      const res = await fetch(`/api/progress?gameId=${gameId}`, { method: 'DELETE' })
                      if (res.ok) {
                        setResetMsg('RESET')
                        setTimeout(() => window.location.reload(), 800)
                      } else {
                        setResetMsg('ERROR')
                        setTimeout(() => setResetMsg(null), 3000)
                        setResetting(false)
                      }
                    } catch {
                      setResetMsg('ERROR')
                      setTimeout(() => setResetMsg(null), 3000)
                      setResetting(false)
                    }
                  }}
                  style={{
                    padding: '7px 14px', flexShrink: 0, marginLeft: 16,
                    background: UA.blue,
                    border: `1px solid ${UA.blueMid}`,
                    borderRadius: 3, cursor: resetting ? 'default' : 'pointer',
                    fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                    color: resetMsg === 'RESET' ? UA.green : resetMsg === 'ERROR' ? '#e04b3c' : UA.yellow,
                    textTransform: 'uppercase',
                    opacity: resetting ? 0.75 : 1,
                    transition: 'color 200ms',
                  }}
                >
                  {resetMsg ?? (resetting ? 'RESETTING…' : '↺ RESET')}
                </button>
              </div>
            )}
          </div>

          {/* Sector breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.blue, borderRadius: 1 }} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.blueMid, textTransform: 'uppercase' }}>SECTOR INTEL</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 28 }}>
            {[1, 2, 3, 4, 5, 6].map(num => {
              const done = completedSectors.includes(num)
              const stat = sectorStats[String(num)]
              return (
                <div key={num} style={{
                  padding: '12px 16px',
                  background: UA.surface,
                  border: `1px solid ${done ? 'rgba(255,215,0,0.18)' : UA.border}`,
                  borderRadius: 4,
                  opacity: done ? 1 : 0.4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: done && stat ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: done ? UA.yellow : UA.muted, textTransform: 'uppercase' }}>
                        {done ? '✓' : '○'} S{num}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '1px', color: done ? UA.text : UA.dim, textTransform: 'uppercase' }}>
                        {SECTOR_NAMES[num]}
                      </span>
                    </div>
                    {done && stat && (
                      <span style={{ fontSize: 8, color: UA.muted }}>{new Date(stat.completedAt).toLocaleDateString('en-CA', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>

                  {done && stat && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                      {[
                        ['KILLS',      String(stat.kills)],
                        ['TIME',       fmtTime(stat.timeAlive)],
                        ['CASH OUT',   `$${stat.moneyEnd}`],
                        ['SQUAD LOST', `${stat.squadLost}/5`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ padding: '6px 8px', background: 'rgba(255,215,0,0.04)', borderRadius: 3 }}>
                          <div style={{ fontSize: 6, fontWeight: 900, letterSpacing: '1.5px', color: UA.muted, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: UA.yellow }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!done && (
                    <div style={{ fontSize: 7, letterSpacing: '1.5px', color: UA.dim, textTransform: 'uppercase', marginTop: 2 }}>NOT YET CLEARED</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Last loadout */}
          {Object.keys(sectorStats).length > 0 && (() => {
            const lastSector = Math.max(...Object.keys(sectorStats).map(Number))
            const belt = sectorStats[String(lastSector)]?.belt ?? []
            if (!belt.length) return null
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.blue, borderRadius: 1 }} />
                  <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.blueMid, textTransform: 'uppercase' }}>LAST LOADOUT</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {belt.map((tool, i) => (
                    <span key={i} style={{
                      padding: '5px 12px', fontSize: 8, fontWeight: 900, letterSpacing: '1.5px',
                      textTransform: 'uppercase', color: UA.blueMid,
                      background: 'rgba(0,104,204,0.12)', border: `1px solid rgba(0,104,204,0.25)`,
                      borderRadius: 3,
                    }}>{tool}</span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Bottom stripe */}
          <div style={{ marginTop: 48, height: 3, background: `linear-gradient(90deg, ${UA.blue} 0%, ${UA.blueMid} 100%)`, borderRadius: 2 }} />
          <div style={{ height: 3, background: `linear-gradient(90deg, ${UA.yellow} 0%, #f5c800 100%)`, borderRadius: 2, marginBottom: 32 }} />
        </div>
      </div>
    </div>
  )
}
