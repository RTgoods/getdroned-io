import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameAccess } from '@/lib/game-access'

export async function GET() {
  const db = await createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error && error.name !== 'AuthSessionMissingError') return NextResponse.json({ error: 'Access service unavailable' }, { status: 503 })
  const access = await gameAccess(db, user)
  if ('unavailable' in access && access.unavailable) return NextResponse.json({ error: 'Access service unavailable' }, { status: 503 })
  const canUseGodMode = user?.email?.trim().toLowerCase() === 'g00dsman@yahoo.com'
  return NextResponse.json({ ...access, canUseGodMode, user: user ? { id: user.id, email: user.email } : null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
