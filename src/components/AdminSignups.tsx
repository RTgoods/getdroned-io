import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const UA = {
  surface: '#0f1828',
  border:  'rgba(0,104,204,0.16)',
  borderFaint: 'rgba(0,104,204,0.08)',
  yellow:  '#ffd700',
  blue:    '#0068cc',
  blueMid: '#4a9eff',
  text:    '#d8e8ff',
  muted:   '#4a6080',
  green:   '#9db35a',
  red:     '#e04b3c',
}

export async function AdminSignups({ page }: { page: number }) {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 50 })
    if (error) throw error

    const { data: game, error: gameError } = await db.from('games').select('id').eq('slug', 'get-droned').single()
    if (gameError || !game) throw new Error('Game unavailable')

    const ids = data.users.map(u => u.id)
    const { data: purchases, error: purchaseError } = ids.length
      ? await db.from('purchases').select('user_id,status,amount_paid_cents,created_at').eq('game_id', game.id).in('user_id', ids)
      : { data: [], error: null }
    if (purchaseError) throw purchaseError

    const byUser = new Map((purchases ?? []).map(p => [p.user_id, p]))
    const paid = data.users.filter(u => byUser.get(u.id)?.status === 'completed').length
    const date = (v?: string | null) => v ? new Date(v).toLocaleDateString('en-CA', { timeZone: 'UTC' }) : '—'

    return (
      <section id="signups" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: UA.yellow, borderRadius: 1 }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '3px', color: UA.yellow, textTransform: 'uppercase' }}>SIGNUPS & PAYMENTS</span>
        </div>

        <div style={{ marginBottom: 10, display: 'flex', gap: 16 }}>
          {[
            { label: 'ACCOUNTS', val: data.users.length },
            { label: 'PAID', val: paid },
            { label: 'NOT PAID', val: data.users.length - paid },
          ].map(({ label, val }) => (
            <div key={label} style={{
              padding: '8px 14px', background: UA.surface,
              border: `1px solid ${UA.border}`, borderRadius: 4, minWidth: 80,
            }}>
              <div style={{ fontSize: 6, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: UA.yellow }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 4, border: `1px solid ${UA.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'rgba(0,104,204,0.08)', borderBottom: `1px solid ${UA.border}` }}>
                {['Account', 'Signed up', 'Payment', 'Amount', 'Paid on'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 7, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map(u => {
                const purchase = byUser.get(u.id)
                const isPaid = purchase?.status === 'completed'
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${UA.borderFaint}` }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ color: UA.text, wordBreak: 'break-all' }}>{u.email || 'No email'}</div>
                      <div style={{ fontSize: 9, color: UA.muted, marginTop: 2 }}>
                        {u.app_metadata?.role === 'admin' ? 'Admin · ' : ''}{u.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: UA.muted }}>{date(u.created_at)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: isPaid ? UA.green : '#e2b13c' }}>
                        {isPaid ? '✓ PAID' : purchase?.status === 'refunded' ? 'REFUNDED' : purchase?.status === 'pending' ? 'PENDING' : 'NOT PAID'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: UA.text }}>
                      {isPaid && purchase.amount_paid_cents != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(purchase.amount_paid_cents / 100)
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: UA.muted }}>{isPaid ? date(purchase.created_at) : '—'}</td>
                  </tr>
                )
              })}
              {!data.users.length && (
                <tr><td colSpan={5} style={{ padding: '24px 14px', color: UA.muted, textAlign: 'center', fontSize: 11 }}>No signups on this page.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <nav style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
          {page > 1 && (
            <Link href={`/admin?page=${page - 1}#signups`} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', textDecoration: 'none' }}>← PREV</Link>
          )}
          {data.users.length === 50 && (
            <Link href={`/admin?page=${page + 1}#signups`} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.blueMid, textTransform: 'uppercase', textDecoration: 'none' }}>NEXT →</Link>
          )}
          <Link href={`/admin?page=${page}#signups`} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.muted, textTransform: 'uppercase', textDecoration: 'none', marginLeft: 'auto' }}>↺ REFRESH</Link>
        </nav>
        <p style={{ marginTop: 6, fontSize: 9, color: UA.muted }}>Page {page} · Dates in UTC · Admin access does not count as payment</p>
      </section>
    )
  } catch {
    return (
      <section id="signups" style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(200,60,30,0.08)', border: '1px solid rgba(200,60,30,0.25)', borderRadius: 4 }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: UA.red, textTransform: 'uppercase', marginBottom: 6 }}>SIGNUPS UNAVAILABLE</div>
        <p style={{ fontSize: 11, color: '#6e6a60' }}>Couldn't load accounts or payment records. Refresh to retry.</p>
      </section>
    )
  }
}
