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

// POST /api/admin/rec — toggle rec_enabled on the get-droned game
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isGameAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { enabled } = await req.json() as { enabled: boolean }

  const { error } = await adminClient()
    .from('games')
    .update({ rec_enabled: enabled })
    .eq('slug', 'get-droned')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rec_enabled: enabled })
}
