'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminRecToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const next = !on
    try {
      const res = await fetch('/api/admin/rec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (res.ok) {
        setOn(next)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 16px', borderRadius: 3, border: 'none',
          cursor: loading ? 'default' : 'pointer',
          background: on
            ? 'linear-gradient(180deg,#c03020 0%,#7a1a10 100%)'
            : 'rgba(0,104,204,0.1)',
          color: on ? '#ffd0c8' : '#4a6080',
          fontSize: 9, fontWeight: 900, letterSpacing: '2.5px', textTransform: 'uppercase',
          opacity: loading ? 0.6 : 1, transition: 'all 150ms',
          boxShadow: on ? '0 2px 0 #4a0a04' : 'none',
          outline: on ? '1px solid rgba(200,60,30,0.4)' : '1px solid rgba(0,104,204,0.2)',
        } as React.CSSProperties}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: on ? '#ff6b6b' : '#243040',
          boxShadow: on ? '0 0 6px #ff4040' : 'none',
          transition: 'all 150ms',
        }} />
        {loading ? 'SAVING…' : on ? 'REC ON' : 'REC OFF'}
      </button>
      <span style={{ fontSize: 9, color: on ? '#e04b3c' : '#4a6080', letterSpacing: '1px' }}>
        {on ? 'B + V active · auto-highlights buffering' : 'Recording disabled for all sessions'}
      </span>
    </div>
  )
}
