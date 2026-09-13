import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { gameAccess } from '@/lib/game-access'
import Link from 'next/link'
import type { SectorStat } from '@/app/api/progress/route'

export const metadata = { title: 'Pilot Stats — GET DRONED' }

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

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/profile')

  const access = await gameAccess(supabase, user)

  let completedSectors: number[] = []
  let sectorStats: Record<string, SectorStat> = {}

  if (access.allowed && access.gameId) {
    const { createClient: createSupabase } = await import('@supabase/supabase-js')
    const admin = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin
      .from('progress')
      .select('completed_sectors, sector_stats')
      .eq('user_id', user.id)
      .eq('game_id', access.gameId)
      .maybeSingle()

    completedSectors = data?.completed_sectors ?? []
    sectorStats = (data?.sector_stats ?? {}) as Record<string, SectorStat>
  }

  const totalKills = Object.values(sectorStats).reduce((s, x) => s + (x.kills ?? 0), 0)
  const totalTime = Object.values(sectorStats).reduce((s, x) => s + (x.timeAlive ?? 0), 0)
  const totalSquadLost = Object.values(sectorStats).reduce((s, x) => s + (x.squadLost ?? 0), 0)

  const UA = {
    bg: '#09101f', surface: '#0f1828', border: 'rgba(0,104,204,0.16)',
    yellow: '#ffd700', blue: '#0068cc', text: '#d8e8ff', muted: '#4a6080', dim: '#243040',
  }

  return (
    <div style={{ minHeight: '100vh', background: UA.bg, color: UA.text, padding: '32px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', textDecoration: 'none' }}>
            ← BACK TO BASE
          </Link>
          <h1 style={{ marginTop: 16, fontSize: 28, fontWeight: 900, letterSpacing: '6px', textTransform: 'uppercase', color: UA.text }}>
            PILOT FILE
          </h1>
          <p style={{ marginTop: 4, fontSize: 10, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase' }}>
            {user.email}
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 32 }}>
          {[
            { label: 'SECTORS CLEARED', value: `${completedSectors.length}/6` },
            { label: 'TOTAL KILLS', value: String(totalKills) },
            { label: 'TIME ON TARGET', value: fmtTime(totalTime) },
            { label: 'SQUAD LOST', value: String(totalSquadLost) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: '14px 16px',
              background: UA.surface,
              border: `1px solid ${UA.border}`,
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: UA.yellow }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Per-sector breakdown */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.yellow, borderRadius: 1 }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>SECTOR INTEL</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const done = completedSectors.includes(num)
            const stat = sectorStats[String(num)]
            return (
              <div key={num} style={{
                padding: '12px 16px',
                background: UA.surface,
                border: `1px solid ${done ? 'rgba(255,215,0,0.18)' : UA.border}`,
                borderRadius: 4,
                opacity: done ? 1 : 0.45,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: done && stat ? 10 : 0 }}>
                  <div>
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: done ? UA.yellow : UA.muted, marginRight: 8, textTransform: 'uppercase' }}>
                      {done ? '✓' : '○'} SECTOR {num}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '1px', color: done ? UA.text : UA.dim, textTransform: 'uppercase' }}>
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
                      ['KILLS', String(stat.kills)],
                      ['TIME', fmtTime(stat.timeAlive)],
                      ['CASH OUT', `$${stat.moneyEnd}`],
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

        {/* Belt breakdown (last known) */}
        {Object.keys(sectorStats).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.blue, borderRadius: 1 }} />
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#4a9eff', textTransform: 'uppercase' }}>LOADOUT AT LAST CLEAR</span>
            </div>
            {(() => {
              const lastSector = Math.max(...Object.keys(sectorStats).map(Number))
              const belt = sectorStats[String(lastSector)]?.belt ?? []
              if (!belt.length) return null
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {belt.map((tool, i) => (
                    <span key={i} style={{
                      padding: '4px 10px', fontSize: 8, fontWeight: 900, letterSpacing: '1.5px',
                      textTransform: 'uppercase', color: '#7bbeff',
                      background: 'rgba(0,104,204,0.12)', border: '1px solid rgba(0,104,204,0.25)',
                      borderRadius: 3,
                    }}>{tool}</span>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Bottom stripe */}
        <div style={{ marginTop: 48, height: 3, background: `linear-gradient(90deg, ${UA.blue} 0%, #7bbeff 100%)`, borderRadius: 2 }} />
        <div style={{ height: 3, background: `linear-gradient(90deg, ${UA.yellow} 0%, #f5c800 100%)`, borderRadius: 2 }} />
      </div>
    </div>
  )
}
