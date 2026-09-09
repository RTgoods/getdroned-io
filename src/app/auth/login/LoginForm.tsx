'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get('redirect') || '/'
  const redirectTo = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') ? requestedRedirect : '/'
  const supabase = createClient()

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) setError(error.message)
      else setMessage('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push(redirectTo); router.refresh() }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(226,177,60,0.2)',
    borderRadius: '2px',
    color: '#e8e4d8',
    fontSize: '13px',
    letterSpacing: '0.5px',
    outline: 'none',
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="label mb-3">
            {mode === 'login' ? 'OPERATOR LOGIN' : 'CREATE ACCOUNT'}
          </p>
          <h1
            className="font-black tracking-[5px] uppercase"
            style={{ fontSize: 28, color: '#f2ead2', textShadow: '0 3px 0 #241f16' }}
          >
            {mode === 'login' ? 'Welcome Back' : 'Enlist Now'}
          </h1>
        </div>

        {/* Card */}
        <div
          className="panel rounded-sm p-6"
          style={{ boxShadow: '0 0 0 1px rgba(226,177,60,0.15), 0 12px 40px rgba(0,0,0,0.6)' }}
        >
          <div
            className="h-0.5 mb-6 -mx-6 -mt-6 rounded-t-sm"
            style={{ background: 'linear-gradient(90deg, transparent, #e2b13c, #c0562f, #e2b13c, transparent)' }}
          />

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-sm"
            style={{
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(226,177,60,0.2)',
              color: '#e8e4d8',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
          >
            {/* Google "G" logo */}
            <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-[8px] tracking-[2px] uppercase font-black" style={{ color: '#4a4740' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-[9px] tracking-[2.5px] uppercase font-black mb-2" style={{ color: '#6e6a60' }}>
                Email
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ ...inputStyle, ...(email ? { borderColor: 'rgba(226,177,60,0.4)' } : {}) }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(226,177,60,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(226,177,60,0.2)')}
              />
            </div>

            <div>
              <p className="text-[9px] tracking-[2.5px] uppercase font-black mb-2" style={{ color: '#6e6a60' }}>
                Password
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(226,177,60,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(226,177,60,0.2)')}
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-sm text-[10px] tracking-[1px] uppercase font-bold"
                style={{ background: 'rgba(192,86,47,0.12)', border: '1px solid rgba(192,86,47,0.3)', color: '#e04b3c' }}
              >
                {error}
              </div>
            )}
            {message && (
              <div
                className="p-3 rounded-sm text-[10px] tracking-[1px] uppercase font-bold"
                style={{ background: 'rgba(157,179,90,0.12)', border: '1px solid rgba(157,179,90,0.3)', color: '#9db35a' }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
              style={{ width: '100%', opacity: loading ? 0.6 : 1, fontSize: 13 }}
            >
              {loading ? 'LOADING…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-[1.5px] uppercase" style={{ color: '#4a4740' }}>
              {mode === 'login' ? 'No account? ' : 'Already enlisted? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
                className="font-black hover:text-[#e2b13c] transition-colors"
                style={{ color: '#a9a396' }}
              >
                {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
