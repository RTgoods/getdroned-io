import Link from 'next/link'

export const metadata = { title: 'All Missions Unlocked — GET DRONED' }

export default async function CheckoutSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center px-4 py-16"
      style={{ background: '#0c0d0b' }}
    >
      <div className="max-w-md w-full">
        {/* Gold top line */}
        <div
          className="h-0.5 mb-10 mx-auto w-24"
          style={{ background: 'linear-gradient(90deg, transparent, #e2b13c, transparent)', boxShadow: '0 0 12px #e2b13c' }}
        />

        <p className="mb-4 text-[10px] font-black tracking-[3px] uppercase" style={{ color: '#9db35a' }}>
          ALL MISSIONS UNLOCKED
        </p>

        <h1
          className="font-black uppercase leading-none mb-6"
          style={{ fontSize: 'clamp(32px, 8vw, 52px)', letterSpacing: '0.12em', color: '#f2ead2', textShadow: '0 4px 0 #1a160e' }}
        >
          GOOD TO GO
        </h1>

        <p className="mb-10 text-[11px] tracking-[2px] uppercase" style={{ color: '#a9a396' }}>
          Purchase confirmed
        </p>

        <Link
          href="/"
          className="inline-block"
          style={{
            background: 'linear-gradient(180deg,#f5c800 0%,#c89e00 100%)',
            color: '#1a1000',
            border: 'none',
            borderRadius: 4,
            padding: '14px 48px',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 0 #7a6000, 0 4px 14px rgba(245,200,0,0.20)',
          }}
        >
          BACK TO BASE
        </Link>
      </div>
    </div>
  )
}
