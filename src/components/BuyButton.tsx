'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DonationAmountPicker } from './DonationAmountPicker'
import type { Game } from '@/types/database'

interface Props {
  game: Game
  userId: string | undefined
  hasPurchased: boolean
}

export function BuyButton({ game, userId, hasPurchased }: Props) {
  const [picking, setPicking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const openPicker = () => {
    if (!userId) {
      router.push(`/auth/login?redirect=/games/${game.slug}`)
      return
    }
    setError('')
    setPicking(true)
  }

  const handleConfirm = async (amountCents: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, amountCents }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  if (hasPurchased) {
    return (
      <div className="text-center">
        <a
          href={`/${game.slug}`}
          className="btn-primary inline-block"
          style={{ fontSize: 16, letterSpacing: '3px', padding: '16px 48px' }}
        >
          ▶ DEPLOY NOW
        </a>
        <p className="mt-2 text-[9px] tracking-[2px] uppercase" style={{ color: '#9db35a' }}>
          MISSION UNLOCKED
        </p>
      </div>
    )
  }

  if (game.price_cents === 0) {
    return (
      <a
        href={`/${game.slug}`}
        className="btn-primary inline-block"
        style={{ fontSize: 16, letterSpacing: '3px', padding: '16px 48px' }}
      >
        ▶ PLAY FREE
      </a>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={openPicker}
        disabled={loading}
        className="btn-primary"
        style={{ fontSize: 16, letterSpacing: '3px', padding: '16px 48px', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'REDIRECTING…' : 'UNLOCK — PAY WHAT YOU WANT'}
      </button>
      {error && !picking && (
        <p className="mt-2 text-[10px] tracking-[2px]" style={{ color: '#e04b3c' }}>
          {error.toUpperCase()}
        </p>
      )}
      <p className="mt-3 text-[9px] tracking-[2.5px] uppercase" style={{ color: '#6e6a60' }}>
        One-time payment · $2 minimum · Instant access · No installs
      </p>
      {picking && (
        <DonationAmountPicker
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
          onCancel={() => { if (!loading) setPicking(false) }}
        />
      )}
    </div>
  )
}
