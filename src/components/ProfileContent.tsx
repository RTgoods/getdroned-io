'use client'

import { useState, useCallback } from 'react'
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

export function ProfileContent({ game, user, hasPurchased, isAdmin, completedSectors, sectorStats, avatarUrl: initialAvatarUrl }: Props) {
  const totalKills = Object.values(sectorStats).reduce((s, x) => s + (x.kills ?? 0), 0)
  const totalTime  = Object.values(sectorStats).reduce((s, x) => s + (x.timeAlive ?? 0), 0)
  const totalSquad = Object.values(sectorStats).reduce((s, x) => s + (x.squadLost ?? 0), 0)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

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
      <GameSidebar
        game={game}
        user={user}
        hasPurchased={hasPurchased}
        isAdmin={isAdmin}
        completedSectors={completedSectors}
        sectorStats={sectorStats}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflowY: 'auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.yellow, borderRadius: 1 }} />
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>PILOT FILE</span>
            </div>

            {/* Avatar + title side by side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
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

          {/* Avatar selector */}
          <div style={{ marginBottom: 28, padding: '20px 20px 18px', background: UA.surface, border: `1px solid ${UA.border}`, borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 10, height: 2, background: UA.yellow, borderRadius: 1 }} />
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>PILOT AVATAR</span>
              </div>
              {saveMsg && (
                <span style={{
                  fontSize: 7, fontWeight: 900, letterSpacing: '2px',
                  color: saveMsg === 'SAVED' ? UA.green : '#e04b3c',
                  textTransform: 'uppercase',
                }}>{saveMsg}</span>
              )}
            </div>
            <AvatarSelector current={avatarUrl} onSave={handleSave} saving={saving} />
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
                      <span style={{ fontSize: 8, color: UA.muted }}>{new Date(stat.completedAt).toLocaleDateString()}</span>
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
