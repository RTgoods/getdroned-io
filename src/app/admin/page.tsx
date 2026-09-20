import { AdminSignups } from '@/components/AdminSignups'
import { AdminRecToggle } from '@/components/AdminRecToggle'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isGameAdmin } from '@/lib/game-access'
import type { Game } from '@/types/database'

export const dynamic = 'force-dynamic'

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

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const requestedPage = Number(params.page || 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1

  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin')
  if (!isGameAdmin(user)) redirect('/')

  const { data: rawGame } = await db.from('games').select('rec_enabled').eq('slug', 'get-droned').single()
  const recEnabled = (rawGame as Pick<Game, 'rec_enabled'> | null)?.rec_enabled ?? false

  const SECTORS = [
    'Franks and Hammers', 'The Trenches', 'The Black Sea',
    'The Oil Fields', 'The Airfield', 'Red Square',
  ]

  return (
    <main style={{ minHeight: '100vh', background: UA.bg, color: UA.text, padding: '32px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', textDecoration: 'none' }}>
            ← BACK TO BASE
          </Link>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.yellow, borderRadius: 1 }} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>COMMAND</span>
          </div>
          <h1 style={{ marginTop: 8, fontSize: 28, fontWeight: 900, letterSpacing: '6px', textTransform: 'uppercase', color: UA.text }}>
            ADMIN
          </h1>
          <p style={{ marginTop: 4, fontSize: 10, letterSpacing: '1.5px', color: UA.muted }}>{user.email}</p>
        </div>

        {/* Recording section */}
        <section style={{
          marginBottom: 24, padding: '20px 24px',
          background: UA.surface, border: `1px solid ${UA.border}`, borderRadius: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ display: 'inline-block', width: 10, height: 2, background: '#e04b3c', borderRadius: 1 }} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: '#e04b3c', textTransform: 'uppercase' }}>RECORDING</span>
          </div>

          <AdminRecToggle enabled={recEnabled} />

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

            {/* Keys */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,104,204,0.06)', border: `1px solid ${UA.borderFaint}`, borderRadius: 4 }}>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', marginBottom: 10 }}>KEYS</div>
              {[
                { key: 'B', label: 'Toggle bot', desc: 'AI takes control — approaches enemies, dodges bullets, patrols objectives' },
                { key: 'V', label: 'Manual record', desc: 'Start / stop — downloads highlight-manual.webm on stop' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 3,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900, color: UA.text,
                  }}>{key}</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: UA.text, letterSpacing: '1px' }}>{label}</div>
                    <div style={{ fontSize: 8, color: UA.muted, marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-highlights */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,104,204,0.06)', border: `1px solid ${UA.borderFaint}`, borderRadius: 4 }}>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', marginBottom: 10 }}>AUTO-HIGHLIGHTS</div>
              <p style={{ fontSize: 8, color: UA.muted, marginBottom: 10, lineHeight: 1.5 }}>
                The last 22 seconds are always buffered during play. These triggers auto-save a clip:
              </p>
              {[
                { trigger: '3+ kills in 5 seconds', file: 'highlight-multikill-x{n}.webm', color: UA.yellow },
                { trigger: 'Survive at ≤14 HP for 5 seconds', file: 'highlight-close-call.webm', color: '#e04b3c' },
              ].map(({ trigger, file, color }) => (
                <div key={trigger} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${UA.borderFaint}` }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color, marginBottom: 2 }}>{trigger}</div>
                  <div style={{ fontSize: 8, color: UA.muted, fontFamily: 'monospace' }}>{file}</div>
                </div>
              ))}
            </div>

            {/* Output */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,104,204,0.06)', border: `1px solid ${UA.borderFaint}`, borderRadius: 4 }}>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', marginBottom: 10 }}>OUTPUT</div>
              {[
                { label: 'Format', value: 'WebM (VP9) · browser Downloads folder' },
                { label: 'Resolution', value: '540 × 960 · 9:16 vertical' },
                { label: 'Ready for', value: 'TikTok · Reels · Shorts — no crop needed' },
                { label: 'Bitrate', value: '6 Mbps · 60 fps target' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 8, color: UA.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, color: UA.text, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,104,204,0.06)', border: `1px solid ${UA.borderFaint}`, borderRadius: 4 }}>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', marginBottom: 10 }}>TIPS</div>
              {[
                'Turn on bot (B), then hit V to record — let the AI play for clean uninterrupted footage',
                'Multi-kill clips save automatically — no need to watch the screen',
                'For a close-call clip, manually drop to low HP with the bot on and wait 5 seconds',
                'WebM plays natively in Chrome — use HandBrake or FFmpeg to convert to MP4 for Instagram',
                'REC dot appears top-right when recording is active',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ flexShrink: 0, fontSize: 8, color: UA.yellow, marginTop: 1 }}>·</span>
                  <span style={{ fontSize: 8, color: UA.muted, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Signups */}
        <AdminSignups page={page} />

        {/* Stage select */}
        <div style={{ marginBottom: 12, marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.blue, borderRadius: 1 }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.blueMid, textTransform: 'uppercase' }}>STAGE SELECT</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {SECTORS.map((name, i) => (
            <div key={name} style={{
              overflow: 'hidden', borderRadius: 4,
              border: `1px solid ${UA.border}`, background: UA.surface,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/get-droned/assets/images/covers/level-${i + 1}.png`}
                alt=""
                style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', marginBottom: 4 }}>
                  SECTOR {i + 1}
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', color: UA.text, textTransform: 'uppercase', marginBottom: 10 }}>
                  {name}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/get-droned/index.html?autostart=${i + 1}&coins=5000${recEnabled ? '&rec=1' : ''}`}
                    style={{
                      flex: 1, textAlign: 'center', padding: '6px 0',
                      background: `linear-gradient(180deg, ${UA.blue} 0%, #004a99 100%)`,
                      border: `1px solid ${UA.border}`, borderRadius: 3,
                      fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                      color: '#e8f4ff', textTransform: 'uppercase', textDecoration: 'none',
                    }}
                  >
                    ▶ PLAY
                  </Link>
                  <Link
                    href={`/get-droned/index.html?boss=${i + 1}&coins=5000${recEnabled ? '&rec=1' : ''}`}
                    style={{
                      flex: 1, textAlign: 'center', padding: '6px 0',
                      background: 'linear-gradient(180deg,#f5c800 0%,#c89e00 100%)',
                      border: '1px solid rgba(245,200,0,0.4)', borderRadius: 3,
                      fontSize: 8, fontWeight: 900, letterSpacing: '2px',
                      color: '#1a1000', textTransform: 'uppercase', textDecoration: 'none',
                      boxShadow: '0 2px 0 #7a6000',
                    }}
                  >
                    ☠ BOSS
                  </Link>
                </div>
                {<div style={{ marginTop: 12 }}>
                  <p style={{ color: UA.text, fontSize: 9, margin: '0 0 6px' }}>Base damage previews · integrity remaining</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[75, 50, 25].map(percent => <Link key={percent}
                      href={`/get-droned/index.html?autostart=${i + 1}&basePreview=${percent}&coins=5000&belt=repair,repair,repair${recEnabled ? '&rec=1' : ''}`}
                      style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: UA.blue, color: '#ffd700', borderRadius: 3, fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>
                      {percent}%
                    </Link>)}
                  </div>
                </div>}

              </div>
            </div>
          ))}
        </div>

        {/* Solved cards preview */}
        <div style={{ marginBottom: 12, marginTop: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.green, borderRadius: 1 }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.green, textTransform: 'uppercase' }}>SOLVED CARDS</span>
        </div>

        {(() => {
          const SOLVED_FILENAMES = ['Level-1-solved.png','Level-2-solved.png','Level-3-Solved.png','Level-4-solved.png','Level-5-solved.png','Level-6-solved.png']
          const solvedCards = [
            ...SECTORS.map((name, i) => ({
              label: `SECTOR ${i + 1} · ${name}`,
              img: `/get-droned/assets/images/covers/${SOLVED_FILENAMES[i]}`,
              href: `/get-droned/index.html?solvedPreview=${i + 1}`,
            })),
            { label: 'GAME COMPLETE', img: '/get-droned/assets/images/covers/Game-Complete.png', href: '/get-droned/index.html?solvedPreview=complete' },
          ]
          return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {solvedCards.map(({ label, img, href }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                overflow: 'hidden', borderRadius: 4,
                border: `1px solid ${UA.border}`, background: UA.surface,
                transition: 'border-color 150ms',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '1px', color: UA.text, textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, color: UA.green, letterSpacing: '1px' }}>PREVIEW →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
          )
        })()}

        {/* Bottom stripe */}
        <div style={{ marginTop: 48, height: 3, background: `linear-gradient(90deg, ${UA.blue} 0%, ${UA.blueMid} 100%)`, borderRadius: 2 }} />
        <div style={{ height: 3, background: `linear-gradient(90deg, ${UA.yellow} 0%, #f5c800 100%)`, borderRadius: 2 }} />
      </div>
    </main>
  )
}
