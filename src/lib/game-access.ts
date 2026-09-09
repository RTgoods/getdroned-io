import type { User } from '@supabase/supabase-js'
import type { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Only trusted Auth app_metadata may grant administrator access.
export function isGameAdmin(user: User | null) {
  return user?.app_metadata?.role === 'admin'
}

export async function gameAccess(db: ReturnType<typeof createServerClient<Database>>, user: User | null) {
  if (!user) return { allowed: false, isAdmin: false, gameId: null }
  const isAdmin = isGameAdmin(user)
  const { data: rawGame, error } = await db.from('games').select('id').eq('slug', 'get-droned').eq('is_published', true).single()
  const game = rawGame as { id: string } | null
  if (isAdmin) return { allowed: true, isAdmin: true, gameId: game?.id ?? null }
  if (error || !game) return { allowed: false, isAdmin: false, gameId: null }
  const { data: purchase, error: purchaseError } = await db.from('purchases').select('id').eq('user_id', user.id).eq('game_id', game.id).eq('status', 'completed').maybeSingle()
  return { allowed: !purchaseError && !!purchase, isAdmin: false, gameId: game.id }
}
