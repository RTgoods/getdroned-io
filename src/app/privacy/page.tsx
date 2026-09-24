import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — GET DRONED' }

const h2 = 'mt-8 mb-2 text-sm font-black tracking-[2px] uppercase text-[#ffd700]'
const p = 'text-[13px] leading-relaxed text-[#c7cfd6] mb-3'
const ul = 'list-disc pl-5 space-y-1 text-[13px] leading-relaxed text-[#c7cfd6] mb-3'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:py-20" style={{ background: '#0c0d0b' }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-sm font-bold text-[#ffd700]">← Back to Main</Link>

        <p className="text-[11px] font-black tracking-[3px] uppercase mb-2" style={{ color: '#ffd700' }}>Legal</p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase mb-1 text-[#f2ead2]">Privacy Policy</h1>
        <p className="text-[11px] tracking-[1px] uppercase text-[#7a8590] mb-6">Last updated September 24, 2026</p>

        <p className={p}>
          This is a plain-language template, not a substitute for advice from a lawyer licensed where you or the site operator are based. It has not been reviewed by counsel.
        </p>

        <h2 className={h2}>1. Who we are</h2>
        <p className={p}>
          Get Droned (getdroned.io) is operated by the Owner of Get Droned, contactable at{' '}
          <a href="mailto:medfixation@gmail.com" className="text-[#7bbeff] underline">medfixation@gmail.com</a>.
        </p>

        <h2 className={h2}>2. What we collect</h2>
        <ul className={ul}>
          <li><strong>Account info:</strong> your email address, and if you sign in with Google or Discord, the basic profile info those providers share (name, email, avatar).</li>
          <li><strong>Gameplay data:</strong> sector completion, kill/run stats, and other progress data, tied to your account.</li>
          <li><strong>Payment data:</strong> Stripe processes payments on our behalf and shares limited transaction details (amount, status) with us — we never see or store your full card number.</li>
          <li><strong>Local device data:</strong> language and a few UI preferences are stored in your browser&apos;s local storage; this stays on your device and isn&apos;t sent to us.</li>
        </ul>

        <h2 className={h2}>3. How we use it</h2>
        <p className={p}>
          To operate your account, save your progress, process payments, communicate with you about your account or purchases, and improve the game.
        </p>

        <h2 className={h2}>4. Who we share it with</h2>
        <ul className={ul}>
          <li>Supabase — database and authentication hosting</li>
          <li>Stripe — payment processing</li>
          <li>Google / Discord — only if you choose to sign in with them</li>
          <li>Vercel — site hosting</li>
        </ul>
        <p className={p}>We do not sell your personal information.</p>

        <h2 className={h2}>5. Data retention &amp; your choices</h2>
        <p className={p}>
          You can reset your gameplay progress at any time from your profile page. To request deletion of your account or data, email{' '}
          <a href="mailto:medfixation@gmail.com" className="text-[#7bbeff] underline">medfixation@gmail.com</a> — we&apos;ll respond as soon as reasonably possible.
        </p>

        <h2 className={h2}>6. Children</h2>
        <p className={p}>
          Get Droned is not directed at children under 13, and we do not knowingly collect personal information from children under 13.
        </p>

        <h2 className={h2}>7. Security</h2>
        <p className={p}>
          We take reasonable measures to protect your data, but no method of transmission or storage is 100% secure.
        </p>

        <h2 className={h2}>8. Changes</h2>
        <p className={p}>
          We may update this policy from time to time. Continued use of the site after changes take effect means you accept the updated policy.
        </p>

        <h2 className={h2}>9. Contact</h2>
        <p className={p}>
          Privacy questions or requests: <a href="mailto:medfixation@gmail.com" className="text-[#7bbeff] underline">medfixation@gmail.com</a>
        </p>

        <div className="h-1 mt-10" style={{ background: 'linear-gradient(90deg, #0057b7 0%, #ffd700 100%)', borderRadius: 2 }} />
      </div>
    </div>
  )
}
