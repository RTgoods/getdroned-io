export function Footer() {
  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'rgba(226,177,60,0.15)', background: '#09090a' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p
            className="font-black tracking-[4px] text-sm uppercase mb-1"
            style={{ color: '#f2ead2' }}
          >
            GET DRONED
          </p>
          <p className="text-[9px] tracking-[2px] uppercase" style={{ color: '#6e6a60' }}>
            Original browser game · Buy once · Play forever
          </p>
        </div>
        <p className="text-[9px] tracking-[2px] uppercase" style={{ color: '#4a4740' }}>
          Payments secured by Stripe
        </p>
      </div>
    </footer>
  )
}
