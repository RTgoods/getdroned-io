import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { MIN_DONATION_CENTS, MAX_DONATION_CENTS } from '@/lib/donation'
import { checkoutLimiter, checkLimit } from '@/lib/rate-limit'
import type { Game } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = await checkLimit(checkoutLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests, please slow down.' }, { status: 429 })

  const body = await request.json()
  const { gameId, amountCents } = body as { gameId: string; amountCents?: number }

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }
  if (!Number.isInteger(amountCents) || amountCents! < MIN_DONATION_CENTS || amountCents! > MAX_DONATION_CENTS) {
    return NextResponse.json({ error: `Enter an amount between $${(MIN_DONATION_CENTS / 100).toFixed(2)} and $${(MAX_DONATION_CENTS / 100).toFixed(0)}` }, { status: 400 })
  }

  // Fetch the game
  const { data: rawGame, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq(gameId === 'static-get-droned' ? 'slug' : 'id', gameId === 'static-get-droned' ? 'get-droned' : gameId)
    .eq('is_published', true)
    .single()

  const game = rawGame as Game | null
  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (game.price_cents === 0) {
    return NextResponse.json({ error: 'This game is free' }, { status: 400 })
  }

  // Prevent duplicate purchases
  const { data: rawExisting } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_id', game.id)
    .eq('status', 'completed')
    .maybeSingle()

  const existing = rawExisting as { id: string } | null
  if (existing) {
    return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (request.headers.get('origin') ?? 'http://localhost:3000')

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${game.title} — Full Access`,
              description: 'Pay-what-you-want unlock. A portion supports Ukraine relief; the rest covers site running costs.',
              images: game.thumbnail_url ? [game.thumbnail_url] : [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        gameId: game.id,
        userId: user.id,
        gameSlug: game.slug,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&slug=${game.slug}`,
      cancel_url: `${baseUrl}/games/${game.slug}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error('Stripe checkout session error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
