'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTop() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const reset = () => {
      if (window.location.hash) return
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.querySelectorAll<HTMLElement>('[data-page-scroll]').forEach(element => {
        element.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      })
    }
    reset()
    const frame = requestAnimationFrame(reset)
    window.addEventListener('pageshow', reset)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pageshow', reset)
      window.history.scrollRestoration = previous
    }
  }, [pathname])

  return null
}
