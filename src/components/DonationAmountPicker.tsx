'use client'

import { useState } from 'react'
import { MIN_DONATION_CENTS } from '@/lib/donation'

const PRESETS = [200, 500, 1000, 2500]

interface Props {
  loading: boolean
  error: string
  onConfirm: (amountCents: number) => void
  onCancel: () => void
}

export function DonationAmountPicker({ loading, error, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<number | null>(500)
  const [custom, setCustom] = useState('')
  const [localError, setLocalError] = useState('')

  const handleConfirm = () => {
    const cents = custom.trim() ? Math.round(parseFloat(custom) * 100) : selected
    if (!cents || !Number.isFinite(cents) || cents < MIN_DONATION_CENTS) {
      setLocalError(`Enter at least $${(MIN_DONATION_CENTS / 100).toFixed(2)}`)
      return
    }
    setLocalError('')
    onConfirm(cents)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,6,4,0.82)', backdropFilter: 'blur(6px)',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#0b1f38',
        border: '1px solid #234569',
        borderTop: '3px solid #ffd700',
        borderRadius: 6,
        padding: '28px 24px 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <h2 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 14, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#f2ead2' }}>
          Unlock All Sectors
        </h2>
        <p style={{ margin: '0 0 18px', textAlign: 'center', fontSize: 11, lineHeight: 1.6, color: '#a9b9cb' }}>
          Pay what you want — ${(MIN_DONATION_CENTS / 100).toFixed(2)} minimum, one time. A portion of every payment supports Ukraine relief; the rest helps cover the cost of running this site.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {PRESETS.map(cents => {
            const active = selected === cents && !custom
            return (
              <button
                key={cents}
                type="button"
                onClick={() => { setSelected(cents); setCustom(''); setLocalError('') }}
                style={{
                  padding: '10px 0', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer',
                  background: active ? 'linear-gradient(180deg,#ffd700 0%,#c8a000 100%)' : 'rgba(0,87,183,0.12)',
                  color: active ? '#0a1000' : '#e8e4d8',
                  border: `1px solid ${active ? 'rgba(245,200,0,0.6)' : 'rgba(0,87,183,0.4)'}`,
                }}
              >
                ${(cents / 100).toFixed(0)}
              </button>
            )
          })}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="donation-custom-amount" style={{ display: 'block', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffd700', marginBottom: 6 }}>
            Or enter a custom amount
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a9b9cb', fontSize: 14 }}>$</span>
            <input
              id="donation-custom-amount"
              type="number"
              min="2"
              step="0.01"
              inputMode="decimal"
              value={custom}
              onChange={e => { setCustom(e.target.value); setLocalError('') }}
              placeholder="2.00"
              style={{
                width: '100%', padding: '10px 12px 10px 26px', boxSizing: 'border-box',
                background: 'rgba(0,87,183,0.07)', border: '1px solid rgba(0,87,183,0.25)',
                borderRadius: 4, color: '#e8e4d8', fontSize: 14, outline: 'none',
              }}
            />
          </div>
        </div>

        {(localError || error) && (
          <p style={{ color: '#e04b3c', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>{localError || error}</p>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          style={{
            width: '100%', padding: 13, marginBottom: 8,
            background: loading ? 'rgba(0,87,183,0.5)' : 'linear-gradient(180deg,#0068d9 0%,#0057b7 100%)',
            border: 'none', borderRadius: 4, color: '#fff', fontWeight: 900, fontSize: 12,
            letterSpacing: '2px', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'REDIRECTING…' : 'CONTINUE TO PAYMENT'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            width: '100%', padding: 11, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
            color: '#6e6a60', fontWeight: 700, fontSize: 10, letterSpacing: '2px',
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
