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

// POST /api/admin/delete-user — remove an auth user (and cascade their profile/purchases)
// so the same email can sign up again during live testing.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isGameAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json() as { userId?: string }
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

  const db = adminClient()

  const { data: target, error: lookupError } = await db.auth.admin.getUserById(userId)
  if (lookupError || !target?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.user.app_metadata?.role === 'admin') {
    return NextResponse.json({ error: 'Cannot delete an admin account' }, { status: 400 })
  }

  const { error } = await db.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
