import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { Game } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { gameId } = body as { gameId: string }

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: game.title,
            description: game.tagline ?? undefined,
            images: game.thumbnail_url ? [game.thumbnail_url] : [],
          },
          unit_amount: game.price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      gameId: game.id,
      userId: user.id,
      gameSlug: game.slug,
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/games/${game.slug}`,
  })

  return NextResponse.json({ url: session.url })
}
