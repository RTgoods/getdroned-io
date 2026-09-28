import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { isGameAdmin } from '@/lib/game-access'

function adminClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// POST /api/admin/create-free-account — create a pre-confirmed account with full
// access to get-droned, for handing out as a gift/giveaway/press key.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isGameAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email } = await req.json() as { email?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const db = adminClient()
  const password = generatePassword()

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created?.user) {
    return NextResponse.json({ error: createError?.message || 'Could not create account' }, { status: 400 })
  }

  const { data: game, error: gameError } = await db.from('games').select('id').eq('slug', 'get-droned').single()
  if (gameError || !game) {
    return NextResponse.json({ error: 'Account created, but the game record is unavailable — grant access manually.' }, { status: 500 })
  }

  const { error: purchaseError } = await db.from('purchases').insert({
    user_id: created.user.id,
    game_id: (game as { id: string }).id,
    status: 'completed',
    amount_paid_cents: 0,
  })
  if (purchaseError) {
    return NextResponse.json({ error: 'Account created, but granting access failed: ' + purchaseError.message }, { status: 500 })
  }

  return NextResponse.json({ email, password })
}
