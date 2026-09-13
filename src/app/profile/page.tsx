import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { gameAccess } from '@/lib/game-access'
import { STATIC_GAMES } from '@/lib/games-catalog'
import { ProfileContent } from '@/components/ProfileContent'
import type { SectorStat } from '@/app/api/progress/route'
import type { User } from '@supabase/supabase-js'

export const metadata = { title: 'Pilot File — GET DRONED' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/profile')

  const access = await gameAccess(supabase, user)

  let completedSectors: number[] = []
  let sectorStats: Record<string, SectorStat> = {}

  if (access.allowed && access.gameId) {
    const { createClient: createSupabase } = await import('@supabase/supabase-js')
    const admin = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin
      .from('progress')
      .select('completed_sectors, sector_stats')
      .eq('user_id', user.id)
      .eq('game_id', access.gameId)
      .maybeSingle()

    completedSectors = data?.completed_sectors ?? []
    sectorStats = (data?.sector_stats ?? {}) as Record<string, SectorStat>
  }

  // Fetch avatar from profile
  let avatarUrl: string | null = null
  {
    const { createClient: createSupabase } = await import('@supabase/supabase-js')
    const admin = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    avatarUrl = profile?.avatar_url ?? null
  }

  const game = STATIC_GAMES.find(g => g.slug === 'get-droned')!

  return (
    <ProfileContent
      game={game}
      user={user as User}
      hasPurchased={access.allowed}
      isAdmin={access.isAdmin ?? false}
      completedSectors={completedSectors}
      sectorStats={sectorStats}
      avatarUrl={avatarUrl}
    />
  )
}
