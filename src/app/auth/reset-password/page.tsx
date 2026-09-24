'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  return <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-sm">
      <Link href="/" className="inline-block py-3 text-sm text-[#ffd700]">← Back to Main</Link>
      <form className="space-y-5 rounded border border-[#234569] border-t-4 border-t-[#0057b7] bg-[#0b1f38] p-6" onSubmit={async event => {
        event.preventDefault()
        if (password !== confirmation) { setMessage('Passwords do not match.'); return }
        setBusy(true); setMessage('')
        try {
          const db = createClient()
          const { data: { user }, error: sessionError } = await db.auth.getUser()
          if (sessionError || !user) { setMessage('This reset link has expired. Request a new link from the sign-in page.'); return }
          const { error } = await db.auth.updateUser({ password })
          if (error) setMessage(error.message)
          else { setDone(true); setMessage('Password updated. You can return to the game.') }
        } catch { setMessage('Could not connect. Please try again.') }
        finally { setBusy(false) }
      }}>
        <h1 className="text-xl font-bold text-[#ffd700]">Choose a new password</h1>
        {!done && <>
          <label className="block text-sm text-[#ffd700]">New password<input autoComplete="new-password" className="mt-2 w-full rounded border border-[#3878b8] bg-[#091a30] p-3 text-base text-white" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="block text-sm text-[#ffd700]">Confirm password<input autoComplete="new-password" className="mt-2 w-full rounded border border-[#3878b8] bg-[#091a30] p-3 text-base text-white" type="password" minLength={6} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
          <button disabled={busy} className="w-full rounded bg-[#0057b7] p-3 font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save password'}</button>
        </>}
        {message && <p role="status" className="text-sm text-[#d8e8ff]">{message}</p>}
        <Link href={done ? '/' : '/auth/login'} className="block py-2 text-sm text-[#ffd700]">{done ? 'Return to game' : 'Back to sign in'}</Link>
      </form>
    </div>
  </div>
}
