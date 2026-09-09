import { AdminSignups } from '@/components/AdminSignups'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isGameAdmin } from '@/lib/game-access'

export const dynamic = 'force-dynamic'
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const requestedPage = Number(params.page || 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin')
  if (!isGameAdmin(user)) redirect('/')
  const names = ['Franks and Hammers', 'The Trenches', 'The Black Sea', 'The Oil Fields', 'The Airfield', 'Red Square']
  return <main className="max-w-4xl mx-auto p-6 text-[#e8e4d8]">
    <Link href="/">← Back to game</Link>
    <h1 className="text-3xl font-bold mt-8">Admin testing</h1>
    <AdminSignups page={page} />
    <p className="mt-2 mb-6">Choose a stage to test.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {names.map((name, i) => <div key={name} className="overflow-hidden rounded border border-[#596449] bg-[#172019]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/get-droned/assets/images/covers/level-${i + 1}.png`} alt="" className="w-full h-36 object-cover" />
        <div className="p-4">
          <p>Stage {i + 1} · {name}</p>
          <div className="flex gap-3 mt-3">
            <Link href={`/get-droned/index.html?autostart=${i + 1}`} className="rounded bg-[#38533c] px-3 py-2">Play level</Link>
            <Link href={`/get-droned/index.html?boss=${i + 1}`} className="rounded bg-[#79432e] px-3 py-2">Fight boss</Link>
          </div>
        </div>
      </div>)}
    </div>
  </main>
}
