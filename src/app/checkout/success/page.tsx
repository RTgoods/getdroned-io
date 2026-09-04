import Link from 'next/link'

export const metadata = { title: 'Mission Unlocked — GET DRONED' }

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4 py-16">
      <div className="max-w-md w-full">
        {/* Gold top line */}
        <div
          className="h-0.5 mb-10 mx-auto w-24"
          style={{ background: 'linear-gradient(90deg, transparent, #e2b13c, transparent)', boxShadow: '0 0 12px #e2b13c' }}
        />

        <p className="label mb-4" style={{ color: '#9db35a' }}>MISSION UNLOCKED</p>

        <h1
          className="font-black uppercase tracking-[6px] mb-4"
          style={{ fontSize: 'clamp(32px, 8vw, 52px)', color: '#f2ead2', textShadow: '0 4px 0 #241f16' }}
        >
          GOOD TO GO
        </h1>

        <p className="mb-2 text-[11px] tracking-[2px] uppercase" style={{ color: '#a9a396' }}>
          Purchase confirmed
        </p>
        <p className="mb-10 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#6e6a60' }}>
          The game is in your library. No download required — boot up the browser and deploy immediately.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary"
            style={{ fontSize: 14, padding: '14px 36px', letterSpacing: '3px' }}
          >
            ▶ DEPLOY NOW
          </Link>
          <Link
            href="/"
            className="btn-ghost"
            style={{ fontSize: 12 }}
          >
            BACK TO BASE
          </Link>
        </div>
      </div>
    </div>
  )
}
