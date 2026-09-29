import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { checkoutStatus, type CheckoutStatus } from '@/lib/checkout-status'
import { CheckoutRefresh } from '@/components/CheckoutRefresh'

export const metadata = { title: 'Payment Status — GET DRONED' }
export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent('/checkout/success' + (sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''))}`)
  const status: CheckoutStatus = sessionId ? await checkoutStatus(db, stripe, user.id, sessionId) : 'invalid'
  const confirmed = status === 'confirmed'
  const retry = status === 'pending' || status === 'unavailable'
  const message = {
    confirmed: 'Purchase confirmed. Full access is ready; complete each sector to unlock the next.',
    pending: 'We are waiting for payment and access confirmation. Please do not pay again.',
    unpaid: 'This checkout has not been paid. Return to base to continue checkout.',
    invalid: 'No valid checkout was found for your account.',
    unavailable: 'We could not verify your payment right now. Please check again before paying.',
  }[status]
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center px-4 py-16"
      style={{ background: '#0c0d0b' }}
    >
      <div className="max-w-md w-full">
        {/* Gold top line */}
        <div
          className="h-0.5 mb-10 mx-auto w-24"
          style={{ background: 'linear-gradient(90deg, transparent, #e2b13c, transparent)', boxShadow: '0 0 12px #e2b13c' }}
        />

        <p className="mb-4 text-[10px] font-black tracking-[3px] uppercase" style={{ color: '#9db35a' }}>
          {confirmed ? 'FULL ACCESS READY' : 'PAYMENT STATUS'}
        </p>

        <h1
          className="font-black uppercase leading-none mb-6"
          style={{ fontSize: 'clamp(32px, 8vw, 52px)', letterSpacing: '0.12em', color: '#f2ead2', textShadow: '0 4px 0 #1a160e' }}
        >
          {confirmed ? 'GOOD TO GO' : 'CHECKOUT'}
        </h1>

        <p className="mb-10 text-[11px] tracking-[2px] uppercase" style={{ color: '#a9a396' }}>
          {message}
        </p>

        {retry && <CheckoutRefresh />}
        <Link
          href="/"
          className="inline-block"
          style={{
            background: 'linear-gradient(180deg,#f5c800 0%,#c89e00 100%)',
            color: '#1a1000',
            border: 'none',
            borderRadius: 4,
            padding: '14px 48px',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 0 #7a6000, 0 4px 14px rgba(245,200,0,0.20)',
          }}
        >
          BACK TO BASE
        </Link>
      </div>
    </div>
  )
}
