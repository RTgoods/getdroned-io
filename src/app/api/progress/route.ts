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
    .select('completed_sectors, sector_stats, reset_version')
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

  return NextResponse.json({ completedSectors, sectorStats, carryMoney, carryBelt, resetVersion: data?.reset_version ?? 0 })
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
    resetVersion?: number
  }
  const { gameId, sector, kills = 0, squadLost = 0, moneyEnd = 0, timeAlive = 0, belt = [], resetVersion = 0 } = body

  if (gameId !== access.gameId || !Number.isInteger(sector) || sector < 1 || sector > 6) {
    return NextResponse.json({ error: 'Invalid game or sector' }, { status: 400 })
  }
  if (!Number.isInteger(resetVersion) || resetVersion < 0) return NextResponse.json({ error: 'Invalid reset version' }, { status: 400 })
  if (!isValidStatInput(kills, squadLost, moneyEnd, timeAlive, belt)) {
    return NextResponse.json({ error: 'Invalid stats' }, { status: 400 })
  }

  if (sector > 1 && !access.allowed) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

  const { data, error } = await adminClient().rpc('save_sector_progress', {
    p_user_id: user.id, p_game_id: gameId, p_sector: sector,
    p_stat: { kills, squadLost, moneyEnd, timeAlive, belt, completedAt: new Date().toISOString() },
    p_reset_version: resetVersion, p_is_admin: access.isAdmin,
  })
  if (error) return NextResponse.json({ error: 'Progress unavailable' }, { status: 503 })
  if (data?.error === 'stale_progress') return NextResponse.json(data, { status: 409 })
  if (data?.error === 'previous_sector_required') return NextResponse.json({ error: `Complete Sector ${sector - 1} first` }, { status: 403 })
  return NextResponse.json(data)
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

  const { data, error } = await adminClient().rpc('reset_sector_progress', {
    p_user_id: user.id, p_game_id: gameId,
  })
  if (error) return NextResponse.json({ error: 'Could not reset progress' }, { status: 503 })
  return NextResponse.json(data)
}
