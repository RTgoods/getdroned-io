'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function CheckoutRefresh() {
  const router = useRouter()
  useEffect(() => {
    // Keep retries bounded; the page also offers a manual check.
    let attempts = 0
    const timer = setInterval(() => {
      if (++attempts >= 12) clearInterval(timer)
      router.refresh()
    }, 5000)
    return () => clearInterval(timer)
  }, [router])
  return <button className="block mx-auto mb-6 text-sm text-[#ffd700] underline" onClick={() => router.refresh()}>Check payment again</button>
}
