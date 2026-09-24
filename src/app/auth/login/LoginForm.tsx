'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'recovery'

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
  useEffect(() => { if (searchParams.get('error') === 'callback_error') setError('That sign-in or reset link has expired. Please request a new one.') }, [searchParams])
  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) { setError(error.message); setLoading(false) }
    } catch {
      setError('Could not connect. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
    if (mode === 'recovery') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/reset-password` })
      if (error) setError(error.message)
      else setMessage('If an account exists for this email, a password reset link will arrive shortly.')
    } else if (mode === 'signup') {
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
    } catch { setError('Could not connect. Please try again.') } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(0,87,183,0.07)',
    border: '1px solid rgba(0,87,183,0.25)',
    borderRadius: '2px',
    color: '#e8e4d8',
    fontSize: '16px',
    letterSpacing: '0.5px',
    outline: 'none',
  }

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-16"
      style={{ background: '#0c0d0b' }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block mb-6 py-2 text-sm font-bold text-[#ffd700]">← Back to Main</Link>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] font-black tracking-[3px] mb-3" style={{ color: '#ffd700' }}>
            🇺🇦 Slava Ukraini
          </div>
          <p className="label mb-3">
            {mode === 'login' ? 'OPERATOR LOGIN' : mode === 'recovery' ? 'RESET PASSWORD' : 'CREATE ACCOUNT'}
          </p>
          {mode === 'signup' && <h1
            className="font-black tracking-[5px] uppercase"
            style={{ fontSize: 28, color: '#f2ead2', textShadow: '0 3px 0 #241f16' }}
          >
            Enlist Now
          </h1>}
        </div>

        {/* Card */}
        <div
          className="panel rounded-sm p-6"
          style={{ background: '#0b1f38', borderColor: '#234569', boxShadow: '0 0 0 1px rgba(70,125,185,0.18), 0 12px 40px rgba(0,0,0,0.7)' }}
        >
          {/* Ukraine flag stripe at top */}
          <div className="h-1 mb-6 -mx-6 -mt-6 rounded-t-sm" style={{
            background: '#0057b7',
          }} />

          {mode !== 'recovery' && <>
          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-sm"
            style={{
              padding: '12px 16px',
              background: 'rgba(0,87,183,0.12)',
              border: '1px solid rgba(0,87,183,0.4)',
              color: '#e8e4d8',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(0,87,183,0.22)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,87,183,0.7)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,87,183,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,87,183,0.4)' }}
          >
            <svg width="15" height="15" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Discord OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth('discord')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-sm mt-3"
            style={{
              padding: '12px 16px',
              background: 'rgba(88,101,242,0.14)',
              border: '1px solid rgba(88,101,242,0.45)',
              color: '#e8e4d8',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(88,101,242,0.24)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88,101,242,0.75)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,101,242,0.14)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88,101,242,0.45)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#5865F2" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
            Continue with Discord
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,104,204,0.12)' }} />
            <span className="text-[11px] tracking-[2px] uppercase font-black" style={{ color: '#a9b9cb' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,104,204,0.12)' }} />
          </div>

          </>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] tracking-[1px] uppercase font-black mb-2" style={{ color: '#ffd700' }}>
                Email
              </label>
              <input
                id="email" autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ ...inputStyle, ...(email ? { borderColor: 'rgba(0,87,183,0.55)' } : {}) }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,87,183,0.7)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = email ? 'rgba(0,87,183,0.55)' : 'rgba(0,87,183,0.25)')}
              />
            </div>

            {mode !== 'recovery' && <div>
              <label htmlFor="password" className="block text-[12px] tracking-[1px] uppercase font-black mb-2" style={{ color: '#ffd700' }}>
                Password
              </label>
              <input
                id="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,87,183,0.7)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,87,183,0.25)')}
              />
            </div>

            }
            {mode === 'login' && <button type="button" onClick={() => { setMode('recovery'); setError(''); setMessage('') }} className="py-2 text-sm text-[#ffd700]">Forgot password?</button>}
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
                style={{ background: 'rgba(157,179,90,0.12)', border: '1px solid rgba(157,179,90,0.3)', color: '#7bbeff' }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-sm font-black uppercase"
              style={{
                padding: '14px 32px',
                background: loading ? 'rgba(0,87,183,0.5)' : 'linear-gradient(180deg,#0068d9 0%,#0057b7 100%)',
                boxShadow: '0 4px 0 #003a7a, 0 6px 20px rgba(0,87,183,0.3)',
                color: '#fff',
                fontSize: 13,
                letterSpacing: '2.5px',
                border: 'none',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'filter 150ms',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
            >
              {loading ? 'LOADING…' : mode === 'login' ? 'SIGN IN' : mode === 'recovery' ? 'SEND RESET LINK' : 'CREATE ACCOUNT'}
            </button>
            {mode === 'signup' && (
              <p className="text-center text-[10px] leading-relaxed tracking-[0.5px]" style={{ color: '#6e7680' }}>
                By creating an account you agree to our{' '}
                <Link href="/terms" className="underline" style={{ color: '#8a95a0' }}>Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline" style={{ color: '#8a95a0' }}>Privacy Policy</Link>.
              </p>
            )}
          </form>

          <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid rgba(0,104,204,0.1)' }}>
            <p className="text-[11px] tracking-[1.5px] uppercase" style={{ color: '#a9b9cb' }}>
              {mode === 'login' ? 'No account? ' : 'Back to '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
                className="font-black transition-colors"
                style={{ color: '#ffd700' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffd700')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ffd700')}
              >
                {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] tracking-[1.5px] uppercase" style={{ color: '#a9b9cb' }}>
          A portion of every payment supports Ukraine relief
        </p>
      </div>
    </div>
  )
}
