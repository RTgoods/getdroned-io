'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminDeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onClick = async () => {
    if (!window.confirm(`Delete ${email}? They'll be able to sign up again with the same email.`)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Delete failed')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          padding: '5px 10px', borderRadius: 3,
          background: 'rgba(200,60,30,0.12)', border: '1px solid rgba(200,60,30,0.35)',
          color: '#e04b3c', fontSize: 8, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase',
          cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '…' : 'DELETE'}
      </button>
      {error && <span style={{ fontSize: 8, color: '#e04b3c', maxWidth: 140, textAlign: 'right' }}>{error}</span>}
    </div>
  )
}
