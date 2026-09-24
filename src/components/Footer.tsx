'use client'

import { useSiteLanguage } from '@/lib/use-site-language'
export function Footer() {
  const { t } = useSiteLanguage()
  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'rgba(0,104,204,0.15)', background: '#09090a' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p
            className="font-black tracking-[4px] text-sm uppercase mb-1"
            style={{ color: '#f2ead2' }}
          >
            GET DRONED
          </p>
          <p className="text-[11px] tracking-[2px] uppercase" style={{ color: '#a9b9cb' }}>{t("Original browser game · Buy once · Play forever")}</p>
        </div>
        <p className="text-[11px] tracking-[2px] uppercase" style={{ color: '#a9b9cb' }}>{t("Payments secured by Stripe")}</p>
      </div>
    </footer>
  )
}
