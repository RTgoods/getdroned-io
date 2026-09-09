import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export async function AdminSignups({ page }: { page: number }) {
  // Rendered only after the admin page has verified the current user's trusted role.
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 50 })
    if (error) throw error
    const { data: game, error: gameError } = await db.from('games').select('id').eq('slug', 'get-droned').single()
    if (gameError || !game) throw new Error('Game unavailable')
    const ids = data.users.map(user => user.id)
    const { data: purchases, error: purchaseError } = ids.length
      ? await db.from('purchases').select('user_id,status,amount_paid_cents,created_at').eq('game_id', game.id).in('user_id', ids)
      : { data: [], error: null }
    if (purchaseError) throw purchaseError
    const byUser = new Map((purchases ?? []).map(purchase => [purchase.user_id, purchase]))
    const paid = data.users.filter(user => byUser.get(user.id)?.status === 'completed').length
    const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'UTC' }) : '—'
    return <section id="signups" className="mt-10 mb-10 rounded border border-[#596449] bg-[#101913] p-4 sm:p-6">
      <h2 className="text-2xl font-bold">Signups & payments</h2>
      <p className="mt-2 text-sm text-[#b5c2ab]">Get Droned · Page {page} · {data.users.length} accounts · {paid} paid · {data.users.length - paid} not paid</p>
      <p className="mt-1 text-xs text-[#b5c2ab]">Admin testing access does not count as a payment. Dates shown in UTC.</p>
      <div className="overflow-x-auto mt-5">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-[#596449] text-[#e2b13c]">
            {['Account', 'Signed up', 'Payment', 'Amount', 'Paid on'].map(title => <th key={title} className="p-3 whitespace-nowrap">{title}</th>)}
          </tr></thead>
          <tbody>{data.users.map(user => {
            const purchase = byUser.get(user.id)
            const isPaid = purchase?.status === 'completed'
            return <tr key={user.id} className="border-b border-[#2c382d]">
              <td className="p-3"><span className="break-all">{user.email || 'No email'}</span>
                <div className="text-xs text-[#b5c2ab] mt-1">{user.app_metadata?.role === 'admin' ? 'Admin / testing · ' : ''}{user.email_confirmed_at ? 'Email confirmed' : 'Email unconfirmed'}</div>
              </td>
              <td className="p-3 whitespace-nowrap">{date(user.created_at)}</td>
              <td className="p-3 whitespace-nowrap"><span className={isPaid ? 'text-[#a9df94]' : 'text-[#edc280]'}>{isPaid ? 'Paid' : purchase?.status === 'refunded' ? 'Not paid · refunded' : purchase?.status === 'pending' ? 'Not paid · pending' : 'Not paid'}</span></td>
              <td className="p-3 whitespace-nowrap">{isPaid && purchase.amount_paid_cents != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(purchase.amount_paid_cents / 100) : '—'}</td>
              <td className="p-3 whitespace-nowrap">{isPaid ? date(purchase.created_at) : '—'}</td>
            </tr>
          })}</tbody>
        </table>
        {!data.users.length && <p className="py-6">No signups on this page.</p>}
      </div>
      <nav aria-label="Signup pages" className="flex gap-5 mt-5">
        {page > 1 && <Link className="underline" href={`/admin?page=${page - 1}#signups`}>← Previous</Link>}
        {data.users.length === 50 && <Link className="underline" href={`/admin?page=${page + 1}#signups`}>Next →</Link>}
        <Link className="underline ml-auto" href={`/admin?page=${page}#signups`}>Refresh list</Link>
      </nav>
    </section>
  } catch {
    return <section id="signups" className="my-10 border border-[#79432e] rounded p-6"><h2 className="text-2xl font-bold">Signups & payments</h2><p className="mt-3">Couldn’t load accounts or payment records. Refresh to retry.</p></section>
  }
}
