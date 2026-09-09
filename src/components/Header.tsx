'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const isLoginPage = pathname === '/auth/login'
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Game pages use their own sidebar — no header there
  if (pathname === '/' || /^\/(get-droned)$/.test(pathname)) return null

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        height: 48,
        background: 'rgba(12,13,11,0.96)',
        borderColor: isLoginPage ? '#ffd700' : 'rgba(226,177,60,0.2)',
        borderBottomWidth: isLoginPage ? 3 : 1,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left — logo */}
        <Link href="/" className="flex items-center gap-3">
          <span
            className="font-black tracking-[4px] text-sm"
            style={{ color: isLoginPage ? '#ffd700' : '#f2ead2', textShadow: isLoginPage ? '0 2px 0 #003580' : '0 2px 0 #241f16' }}
          >
            GET DRONED
          </span>
          <span
            className="hidden sm:block text-[8px] tracking-[2px] font-black"
            style={{ color: isLoginPage ? '#ffd700' : '#c0562f' }}
          >
            Slava Ukraini
          </span>
        </Link>

        {/* Right — nav */}
        <nav className="flex items-center gap-4">
          {isLoginPage && (
            <Link
              href="/"
              className="text-[10px] tracking-[1px] font-black uppercase px-3 py-2 rounded"
              style={{ background: '#0057b7', color: '#ffd700', border: '1px solid #287ac9' }}
            >
              ← Back to main
            </Link>
          )}
          {user && (
            <Link
              href="/"
              className="text-[10px] tracking-[3px] font-black uppercase hover:text-[#e2b13c] transition-colors"
              style={{ color: isLoginPage ? '#ffd700' : '#9db35a' }}
            >
              ▶ PLAY
            </Link>
          )}

          {user ? (
            <button
              onClick={signOut}
              className="text-[10px] tracking-[2px] font-black uppercase"
              style={{ color: isLoginPage ? '#fff' : '#6e6a60' }}
            >
              SIGN OUT
            </button>
          ) : !isLoginPage ? (
            <Link
              href="/auth/login"
              className="text-[10px] tracking-[2px] font-black uppercase px-3 py-1.5 rounded"
              style={{
                background: 'linear-gradient(180deg,#c0562f,#7d3016)',
                color: '#fff',
                boxShadow: '0 2px 0 #4a1b0c',
              }}
            >
              SIGN IN
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
