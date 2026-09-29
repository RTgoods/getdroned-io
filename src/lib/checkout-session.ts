import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

export class CheckoutError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

// The database pins both the idempotency key and payload across workers/retries.
export async function checkoutSession(db: SupabaseClient, stripe: Stripe, userId: string, gameId: string, params: Stripe.Checkout.SessionCreateParams) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: reservation, error } = await db.rpc('reserve_checkout', {
      p_user_id: userId, p_game_id: gameId, p_params: params,
    })
    if (error || !reservation) throw new CheckoutError('Checkout unavailable. Please try again.', 503)
    if (reservation.error === 'already_purchased') throw new CheckoutError('Already purchased', 409)
    let session: Stripe.Checkout.Session
    if (reservation.stripe_session_id) {
      session = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id)
    } else {
      // Never recreate an uncertain session after Stripe may have pruned its key.
      if (Date.now() - Date.parse(reservation.created_at) > 23 * 60 * 60 * 1000) {
        throw new CheckoutError('Your previous checkout needs verification. Please contact support before paying again.', 409)
      }
      session = await stripe.checkout.sessions.create(reservation.params, { idempotencyKey: `checkout:${reservation.id}` })
      const { error: saveError } = await db.from('checkout_attempts').update({ stripe_session_id: session.id }).eq('id', reservation.id)
      if (saveError) throw new CheckoutError('Checkout unavailable. Please try again.', 503)
      // Idempotent creation can replay the original response after payment.
      session = await stripe.checkout.sessions.retrieve(session.id)
    }
    if (session.status === 'complete' || session.payment_status === 'paid') {
      return { url: `${new URL(params.success_url!).origin}/checkout/success?session_id=${encodeURIComponent(session.id)}` }
    }
    const amount = params.line_items?.[0]?.price_data?.unit_amount
    if (session.status === 'open' && session.amount_total === amount && session.url) return { url: session.url }
    // A changed amount must expire the old payable session before replacing it.
    if (session.status === 'open') await stripe.checkout.sessions.expire(session.id)
    else if (session.status !== 'expired') throw new CheckoutError('Payment is being verified. Please try again shortly.', 409)
    const { error: deleteError } = await db.from('checkout_attempts').delete().eq('id', reservation.id)
    if (deleteError) throw new CheckoutError('Checkout unavailable. Please try again.', 503)
  }
  throw new CheckoutError('Checkout changed in another tab. Please try again.', 409)
}
