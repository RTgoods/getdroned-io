'use client'

interface Props {
  price: string
  onBuy: () => void
  onDismiss: () => void
}

export function DonationPopup({ price, onBuy, onDismiss }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,6,4,0.82)', backdropFilter: 'blur(6px)',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#131510',
        border: '1px solid rgba(226,177,60,0.22)',
        borderTop: '3px solid #e2b13c',
        borderRadius: 6,
        padding: '32px 28px 28px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#4a4740', fontSize: 18, lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>

        {/* Icon */}
        <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>🇺🇦</div>

        {/* Heading */}
        <h2 style={{
          margin: '0 0 10px', textAlign: 'center',
          fontSize: 15, fontWeight: 900, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#f2ead2',
        }}>
          Sector One: Complete
        </h2>

        {/* Body */}
        <p style={{
          margin: '0 0 8px', textAlign: 'center', lineHeight: 1.7,
          fontSize: 12, color: '#9a9288',
        }}>
          You just cleared Franks And Hammers. Five more sectors are waiting — each one harder,
          stranger, and more worth your time.
        </p>
        <p style={{
          margin: '0 0 24px', textAlign: 'center', lineHeight: 1.7,
          fontSize: 12, color: '#9a9288',
        }}>
          If you'd like to continue, unlocking the full game is{' '}
          <span style={{ color: '#e2b13c', fontWeight: 700 }}>{price}</span> — a one-time
          purchase, no subscription. Half of everything goes directly to{' '}
          <span style={{ color: '#6b9fd4', fontWeight: 700 }}>Ukraine humanitarian relief</span>.
          No pressure either way.
        </p>

        {/* Ukraine relief note */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 20, padding: '8px 12px', borderRadius: 4,
          background: 'rgba(0,87,183,0.1)', border: '1px solid rgba(0,87,183,0.25)',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            100% of your purchase goes to Ukraine relief
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onBuy}
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(160deg,#b84f2a,#7d2f14)',
              border: '1px solid rgba(192,86,47,0.5)',
              borderRadius: 4, cursor: 'pointer',
              color: '#fff', fontWeight: 900, fontSize: 11,
              letterSpacing: '2.5px', textTransform: 'uppercase',
              boxShadow: '0 3px 12px rgba(192,86,47,0.3)',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            Unlock All Sectors — {price}
          </button>

          <button
            onClick={onDismiss}
            style={{
              width: '100%', padding: '11px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4, cursor: 'pointer',
              color: '#6e6a60', fontWeight: 700, fontSize: 10,
              letterSpacing: '2px', textTransform: 'uppercase',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
