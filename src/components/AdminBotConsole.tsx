'use client'

import { useEffect, useRef, useState } from 'react'

type Status = { ready: boolean; running: boolean; phase: string; recording: boolean; error: string; elapsed: number; kills: number; flags: number; hubDestroyed: boolean; health: number; base: number; recordSupported: boolean }
const button = { padding: '10px 14px', background: '#0068cc', color: '#fff', border: '1px solid #428bd6', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 800 } as const

export function AdminBotConsole() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [session, setSession] = useState(0)
  const [status, setStatus] = useState<Status | null>(null)
  const [recordRun, setRecordRun] = useState(true)
  const [connectionError, setConnectionError] = useState('')
  const send = (action: string) => frame.current?.contentWindow?.postMessage({ type: 'gd:botControl', action, record: recordRun }, window.location.origin)

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'gd:botStatus') return
      setStatus(event.data)
      setConnectionError('')
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])
  useEffect(() => {
    if (!session || status?.ready) return
    const timer = setTimeout(() => setConnectionError('If the preview is still unavailable, reload it and check that your admin session is signed in.'), 20000)
    return () => clearTimeout(timer)
  }, [session, status?.ready])

  const load = () => { setStatus(null); setConnectionError(''); setSession(v => v + 1) }
  const disabled = !status?.ready
  return <section style={{ marginBottom: 24, padding: 20, background: '#0f1828', border: '1px solid #285c91', borderRadius: 6 }}>
    <h2 style={{ fontSize: 17, fontWeight: 900, color: '#ffd700' }}>SECTOR 1 · BOT & RECORDING</h2>
    <p style={{ color: '#a8bfd9', fontSize: 12, lineHeight: 1.6, margin: '8px 0 14px' }}>
      Watch the bot fight, destroy the drone hub and capture flags on its way to the boss. Normal damage and ammunition rules apply; a run can fail. Testing stops at the Sector 1 result and does not unlock sectors on your profile.
    </p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button style={button} disabled={!!status?.recording} onClick={load}>{session ? 'Fresh Sector 1 run' : 'Load Sector 1 preview'}</button>
      <button style={{ ...button, background: '#ffd700', color: '#09101f', opacity: disabled || status?.running ? .45 : 1 }} disabled={disabled || status?.running || status?.phase === 'Sector 1 complete' || status?.phase === 'Run failed'} onClick={() => send('start')}>Start / resume bot</button>
      <button style={button} disabled={!status?.running} onClick={() => send('pause')}>Pause bot</button>
      <button style={button} disabled={!status} onClick={() => send('stop')}>Stop & save recording</button>
    </div>
    <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
      <label><input type="checkbox" checked={recordRun} onChange={e => setRecordRun(e.target.checked)} /> Record when bot starts</label>
      <button style={button} disabled={disabled || !status?.recordSupported || status?.recording} onClick={() => send('recordStart')}>Start recording</button>
      <button style={button} disabled={!status?.recording} onClick={() => send('recordStop')}>Save video</button>
    </div>
    <p style={{ fontSize: 11, color: '#a8bfd9', marginBottom: 12 }}>Uses the existing 540 × 960 portrait recorder (game canvas, no audio). Stop or finish the run to download the video. Keep this page open until it saves. Pause leaves recording running. Automatic highlight downloads are off in this console.</p>
    <div role="status" aria-live="polite" style={{ color: '#ffd700', fontSize: 12, marginBottom: 10 }}>
      {status ? `${status.phase} · ${status.elapsed}s · ${status.kills} kills · ${status.flags}/3 flags · Drone hub: ${status.hubDestroyed ? 'destroyed' : 'active'} · Health ${status.health} · Base ${status.base}%${status.recording ? ' · ● RECORDING' : ''}` : session ? 'Loading Sector 1…' : 'Preview not loaded'}
    </div>
    {(status?.error || connectionError || (status && !status.recordSupported)) && <p role="alert" style={{ color: '#ffbc86', fontSize: 12 }}>{status?.error || connectionError || 'Recording is not supported in this browser. Try Chrome or Edge.'}</p>}
    {!!session && <iframe key={session} ref={frame} title="Sector 1 bot live preview" src="/get-droned/index.html?autostart=1&rec=1&bot=1" allow="autoplay" style={{ width: '100%', height: 'min(72vh, 720px)', minHeight: 400, border: '1px solid #285c91', borderRadius: 5, background: '#03070c' }} />}
  </section>
}
