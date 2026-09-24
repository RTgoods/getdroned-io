'use client'

import { useRouter } from 'next/navigation'
import { GameSidebar } from './GameSidebar'
import type { Game } from '@/types/database'
import type { User } from '@supabase/supabase-js'

export function AdminGameSidebar({ game, user, hasPurchased, recEnabled }: { game: Game; user: User; hasPurchased: boolean; recEnabled: boolean }) {
  const router = useRouter()
  return (
    <GameSidebar
      game={game}
      user={user}
      hasPurchased={hasPurchased}
      isAdmin={true}
      onPlay={(level) => router.push(`/get-droned/index.html?autostart=${level}&coins=5000${recEnabled ? '&rec=1' : ''}`)}
    />
  )
}
