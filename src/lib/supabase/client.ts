import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function safeUrl(value: string | undefined): string {
  if (!value) return 'https://placeholder.supabase.co'
  try { new URL(value); return value } catch { return 'https://placeholder.supabase.co' }
}

export function createClient() {
  return createBrowserClient<Database>(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
