import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameAccess } from '@/lib/game-access'

export async function GET() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  const access = await gameAccess(db, user)
  const canUseGodMode = user?.email?.trim().toLowerCase() === 'g00dsman@yahoo.com'
  return NextResponse.json({ ...access, canUseGodMode, user: user ? { id: user.id, email: user.email } : null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
