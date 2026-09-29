import type Stripe from 'stripe'
import type { createClient } from '@/lib/supabase/server'

export type CheckoutStatus = 'confirmed' | 'pending' | 'unpaid' | 'invalid' | 'unavailable'

export async function checkoutStatus(db: Awaited<ReturnType<typeof createClient>>, stripe: Stripe, userId: string, sessionId: string): Promise<CheckoutStatus> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.userId !== userId || !session.metadata?.gameId) return 'invalid'
    if (session.payment_status !== 'paid') return session.status === 'complete' ? 'pending' : 'unpaid'
    const { data, error } = await db.from('purchases').select('id')
      .eq('user_id', userId).eq('game_id', session.metadata.gameId)
      .eq('status', 'completed').maybeSingle()
    if (error) return 'unavailable'
    return data ? 'confirmed' : 'pending'
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'resource_missing') return 'invalid'
    return 'unavailable'
  }
}
