import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileLimiter, checkLimit } from '@/lib/rate-limit'
import type { Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

const VALID_KIT_IDS = [
  'woodland','urban','ranger','desert','night','god',
  'woodland-snow','urban-snow','ranger-snow','desert-snow','night-snow',
]

// GET /api/profile  – returns { avatar_url, display_name }
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { success } = await checkLimit(profileLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { data } = await supabase
    .from('profiles')
    .select('avatar_url, display_name')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json(data ?? { avatar_url: null, display_name: null })
}

// PATCH /api/profile  – { avatar_url: string }
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { success } = await checkLimit(profileLimiter, user.id)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const updates: ProfileUpdate = {}

  if ('avatar_url' in body) {
    const val = body.avatar_url
    if (val !== null && (typeof val !== 'string' || !VALID_KIT_IDS.includes(val))) {
      return NextResponse.json({ error: 'Invalid avatar_url' }, { status: 400 })
    }
    updates.avatar_url = val as string | null
  }

  if ('display_name' in body) {
    const dn = body.display_name
    if (dn !== null && (typeof dn !== 'string' || dn.length > 60)) {
      return NextResponse.json({ error: 'Invalid display_name' }, { status: 400 })
    }
    updates.display_name = dn as string | null
  }

  if (!Object.keys(updates).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  // Cast needed: Supabase strict generics require exact Update shape match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any).update(updates).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
