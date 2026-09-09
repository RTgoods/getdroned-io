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
