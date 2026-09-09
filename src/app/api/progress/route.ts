import { gameAccess } from '@/lib/game-access'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function safeUrl(v: string | undefined) {
  if (!v) return 'https://placeholder.supabase.co'
  try { new URL(v); return v } catch { return 'https://placeholder.supabase.co' }
}

function adminClient() {
  return createSupabase(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
  )
}

// GET /api/progress?gameId=xxx — return completed sectors for the current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await gameAccess(supabase, user)
  if (!access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const gameId = req.nextUrl.searchParams.get('gameId')
  if (!gameId || gameId !== access.gameId) return NextResponse.json({ error: 'Invalid game' }, { status: 400 })

  const { data } = await adminClient()
    .from('progress')
    .select('completed_sectors')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle()

  return NextResponse.json({ completedSectors: data?.completed_sectors ?? [] })
}

// POST /api/progress — upsert a completed sector
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await gameAccess(supabase, user)
  if (!access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const { gameId, sector } = await req.json() as { gameId: string; sector: number }
  if (gameId !== access.gameId || !Number.isInteger(sector) || sector < 1 || sector > 6) return NextResponse.json({ error: 'Invalid game or sector' }, { status: 400 })

  const db = adminClient()

  // Fetch existing
  const { data: existing } = await db
    .from('progress')
    .select('completed_sectors')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle()

  const current: number[] = existing?.completed_sectors ?? []
  const updated = current.includes(sector) ? current : [...current, sector].sort((a, b) => a - b)

  const { error } = await db.from('progress').upsert(
    { user_id: user.id, game_id: gameId, completed_sectors: updated, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,game_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ completedSectors: updated })
}

// DELETE /api/progress — reset all progress (paid users only)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await gameAccess(supabase, user)
  if (!access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const gameId = req.nextUrl.searchParams.get('gameId')
  if (!gameId || gameId !== access.gameId) return NextResponse.json({ error: 'Invalid game' }, { status: 400 })

  await adminClient()
    .from('progress')
    .delete()
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  return NextResponse.json({ completedSectors: [] })
}
