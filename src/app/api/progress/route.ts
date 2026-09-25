import { gameAccess } from '@/lib/game-access'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { progressLimiter, checkLimit } from '@/lib/rate-limit'
import { isValidStatInput } from '@/lib/progress-validation'

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

export interface SectorStat {
  kills: number
  squadLost: number
  moneyEnd: number
  timeAlive: number
  belt: string[]
  completedAt: string
}

// GET /api/progress?gameId=xxx — return completed sectors + stats for the current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { success } = await checkLimit(progressLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const access = await gameAccess(supabase, user)


  const gameId = req.nextUrl.searchParams.get('gameId')
  if (!gameId || gameId !== access.gameId) return NextResponse.json({ error: 'Invalid game' }, { status: 400 })

  const { data, error } = await adminClient()
    .from('progress')
    .select('completed_sectors, sector_stats')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Progress unavailable' }, { status: 503 })
  const completedSectors: number[] = data?.completed_sectors ?? []
  const sectorStats: Record<string, SectorStat> = data?.sector_stats ?? {}

  // Derive carry state from the most recently completed sector
  const lastSector = completedSectors.length > 0 ? Math.max(...completedSectors) : 0
  const lastStats = lastSector > 0 ? sectorStats[String(lastSector)] : null
  const carryMoney = lastStats?.moneyEnd ?? 0
  const carryBelt = lastStats?.belt ?? []

  return NextResponse.json({ completedSectors, sectorStats, carryMoney, carryBelt })
}

// POST /api/progress — upsert a completed sector + save its stats
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { success } = await checkLimit(progressLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const access = await gameAccess(supabase, user)


  const body = await req.json() as {
    gameId: string
    sector: number
    kills?: number
    squadLost?: number
    moneyEnd?: number
    timeAlive?: number
    belt?: string[]
  }
  const { gameId, sector, kills = 0, squadLost = 0, moneyEnd = 0, timeAlive = 0, belt = [] } = body

  if (gameId !== access.gameId || !Number.isInteger(sector) || sector < 1 || sector > 6) {
    return NextResponse.json({ error: 'Invalid game or sector' }, { status: 400 })
  }
  if (!isValidStatInput(kills, squadLost, moneyEnd, timeAlive, belt)) {
    return NextResponse.json({ error: 'Invalid stats' }, { status: 400 })
  }

  if (sector > 1 && !access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const db = adminClient()

  // Fetch existing
  const { data: existing, error: readError } = await db
    .from('progress')
    .select('completed_sectors, sector_stats')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: 'Progress unavailable' }, { status: 503 })
  const current: number[] = existing?.completed_sectors ?? []
  if (!access.isAdmin && sector > 1 && !current.includes(sector - 1)) return NextResponse.json({ error: `Complete Sector ${sector - 1} first` }, { status: 403 })
  const updated = current.includes(sector) ? current : [...current, sector].sort((a, b) => a - b)

  const existingStats: Record<string, SectorStat> = existing?.sector_stats ?? {}
  const newStat: SectorStat = {
    kills,
    squadLost,
    moneyEnd,
    timeAlive,
    belt,
    completedAt: new Date().toISOString(),
  }
  // Keep best kill count if replayed
  const prev = existingStats[String(sector)]
  const updatedStats = {
    ...existingStats,
    [String(sector)]: prev && prev.kills > kills ? prev : newStat,
  }

  const { error } = await db.from('progress').upsert(
    {
      user_id: user.id,
      game_id: gameId,
      completed_sectors: updated,
      sector_stats: updatedStats,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,game_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return carry state for the sector just completed
  return NextResponse.json({
    completedSectors: updated,
    sectorStats: updatedStats,
    carryMoney: moneyEnd,
    carryBelt: belt,
  })
}

// DELETE /api/progress — reset all progress
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { success } = await checkLimit(progressLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const access = await gameAccess(supabase, user)
  if (!access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const gameId = req.nextUrl.searchParams.get('gameId')
  if (!gameId || gameId !== access.gameId) return NextResponse.json({ error: 'Invalid game' }, { status: 400 })

  const { error } = await adminClient()
    .from('progress')
    .delete()
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  if (error) return NextResponse.json({ error: 'Could not reset progress' }, { status: 503 })
  return NextResponse.json({ completedSectors: [], sectorStats: {}, carryMoney: 0, carryBelt: [] })
}
