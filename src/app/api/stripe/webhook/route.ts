import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Bypass RLS — only used server-side in this webhook handler
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')) {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })
    const { gameId, userId } = (session.metadata ?? {}) as {
      gameId: string
      userId: string
    }

    if (!gameId || !userId) {
      console.error('Missing metadata in checkout session', session.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('purchases').upsert(
      {
        user_id: userId,
        game_id: gameId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string | null,
        amount_paid_cents: session.amount_total,
        status: 'completed',
      },
      { onConflict: 'user_id,game_id' }
    )

    if (error) {
      console.error('Failed to record purchase:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    console.log(`✅ Purchase recorded: user=${userId} game=${gameId}`)
  }

  return NextResponse.json({ received: true })
}
