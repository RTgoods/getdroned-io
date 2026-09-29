'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const UA = {
  surface: '#0f1828',
  border:  'rgba(0,104,204,0.16)',
  borderFaint: 'rgba(0,104,204,0.08)',
  yellow:  '#ffd700',
  blue:    '#0068cc',
  blueMid: '#4a9eff',
  text:    '#d8e8ff',
  muted:   '#4a6080',
  green:   '#9db35a',
  red:     '#e04b3c',
}

export function AdminCreateFreeAccount() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ email: string; password: string } | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/create-free-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || undefined }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not create account')
      setResult(body)
      setEmail('')
      setPassword('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ marginBottom: 24, padding: '20px 24px', background: UA.surface, border: `1px solid ${UA.border}`, borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ display: 'inline-block', width: 10, height: 2, background: UA.green, borderRadius: 1 }} />
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.green, textTransform: 'uppercase' }}>GIVE FREE ACCOUNT</span>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="recipient@example.com"
          style={{
            flex: '1 1 220px', padding: '9px 12px', background: 'rgba(0,104,204,0.07)',
            border: `1px solid ${UA.border}`, borderRadius: 3, color: UA.text, fontSize: 12, outline: 'none',
          }}
        />
        <input
          type="text"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password (leave blank to auto-generate)"
          minLength={6}
          style={{
            flex: '1 1 220px', padding: '9px 12px', background: 'rgba(0,104,204,0.07)',
            border: `1px solid ${UA.border}`, borderRadius: 3, color: UA.text, fontSize: 12, outline: 'none',
            fontFamily: 'monospace',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 3, border: 'none',
            background: loading ? 'rgba(0,104,204,0.3)' : `linear-gradient(180deg, ${UA.blue} 0%, #004a99 100%)`,
            color: '#e8f4ff', fontSize: 9, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <p style={{ marginTop: 8, fontSize: 9, color: UA.muted }}>
        Creates a pre-confirmed account with full access to every sector — no payment, no email verification needed. Set your own password or leave blank to auto-generate one; either way it&apos;s shown once below, so copy it before leaving this page.
      </p>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(200,60,30,0.1)', border: '1px solid rgba(200,60,30,0.3)', borderRadius: 4, color: UA.red, fontSize: 11 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(157,179,90,0.08)', border: `1px solid ${UA.green}`, borderRadius: 4 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '2px', color: UA.green, textTransform: 'uppercase', marginBottom: 8 }}>
            ACCOUNT CREATED · SHARE THESE NOW
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 7, color: UA.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Email</div>
              <div style={{ fontSize: 13, color: UA.text, fontFamily: 'monospace' }}>{result.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 7, color: UA.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>Password</div>
              <div style={{ fontSize: 13, color: UA.yellow, fontFamily: 'monospace' }}>{result.password}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
