'use client'

import { useEffect, useState } from 'react'
import { translate } from '../../public/get-droned/assets/js/language'
import copy from './site-uk.json'

export function useSiteLanguage() {
  const [ukrainian, setUkrainian] = useState(false)
  useEffect(() => {
    const sync = () => {
      let enabled = false
      try { enabled = localStorage.getItem('gd_language') === 'uk' } catch {}
      setUkrainian(enabled)
      document.documentElement.lang = enabled ? 'uk' : 'en'
    }
    sync()
    window.addEventListener('gd:language', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('gd:language', sync); window.removeEventListener('storage', sync) }
  }, [])
  const t = (text: string) => ukrainian ? text.split('\n\n').map(part => (copy as Record<string, string>)[part] || translate(part)).join('\n\n') : text
  return { t, ukrainian }
}
