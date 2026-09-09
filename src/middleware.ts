import { gameAccess, isGameAdmin } from './lib/game-access'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const gameFile = path === '/get-droned/index.html' || path.startsWith('/get-droned/assets/js/')
  const adminPage = path === '/admin' || path.startsWith('/admin/')
  if (gameFile || adminPage) {
    const privateResponse = (response: NextResponse) => {
      response.headers.set('Cache-Control', 'private, no-store')
      supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
      return response
    }
    if (!user) return privateResponse(NextResponse.redirect(new URL('/auth/login?redirect=' + (adminPage ? '/admin' : '/'), request.url)))
    if (adminPage && !isGameAdmin(user)) return privateResponse(new NextResponse('Admin access required', { status: 403 }))
    if (gameFile) {
      const access = await gameAccess(supabase, user)
      if (!access.allowed) return privateResponse(new NextResponse('Purchase required. Return to the home page to buy access.', { status: 403 }))
      if (request.nextUrl.searchParams.has('boss') && !access.isAdmin) return privateResponse(new NextResponse('Admin access required', { status: 403 }))
      if (path.endsWith('index.html') && !access.isAdmin && ! /^[1-6]$/.test(request.nextUrl.searchParams.get('autostart') || '')) {
        const url = request.nextUrl.clone()
        url.searchParams.set('autostart', '1')
        return privateResponse(NextResponse.redirect(url))
      }
    }
    supabaseResponse.headers.set('Cache-Control', 'private, no-store')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
