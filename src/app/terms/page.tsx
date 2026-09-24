import Link from 'next/link'

export const metadata = { title: 'Terms of Service — GET DRONED' }

const h2 = 'mt-8 mb-2 text-sm font-black tracking-[2px] uppercase text-[#ffd700]'
const p = 'text-[13px] leading-relaxed text-[#c7cfd6] mb-3'
const ul = 'list-disc pl-5 space-y-1 text-[13px] leading-relaxed text-[#c7cfd6] mb-3'

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:py-20" style={{ background: '#0c0d0b' }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-sm font-bold text-[#ffd700]">← Back to Main</Link>

        <p className="text-[11px] font-black tracking-[3px] uppercase mb-2" style={{ color: '#ffd700' }}>Legal</p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase mb-1 text-[#f2ead2]">Terms of Service</h1>
        <p className="text-[11px] tracking-[1px] uppercase text-[#7a8590] mb-6">Last updated September 24, 2026</p>

        <p className={p}>
          This is a plain-language template, not a substitute for advice from a lawyer licensed where you or the site operator are based. It has not been reviewed by counsel.
        </p>

        <h2 className={h2}>1. Who we are</h2>
        <p className={p}>
          &ldquo;Get Droned,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;the site&rdquo; refers to the Owner of Get Droned, the operator of getdroned.io, contactable at{' '}
          <a href="mailto:medfixation@gmail.com" className="text-[#7bbeff] underline">medfixation@gmail.com</a>. Get Droned is a browser-based video game and its associated storefront.
        </p>

        <h2 className={h2}>2. Acceptance of terms</h2>
        <p className={p}>
          By creating an account, signing in, or otherwise using getdroned.io, you agree to these Terms. If you do not agree, do not use the site.
        </p>

        <h2 className={h2}>3. Accounts</h2>
        <ul className={ul}>
          <li>An account (email/password, or Google/Discord sign-in) is required to save progress or unlock the full game.</li>
          <li>You&apos;re responsible for keeping your credentials secure and for activity under your account.</li>
          <li>You must provide accurate information and be legally able to enter this agreement in your jurisdiction.</li>
        </ul>

        <h2 className={h2}>4. Payments &amp; pricing</h2>
        <ul className={ul}>
          <li>Sector 1 is free to play once signed in.</li>
          <li>Unlocking Sectors 2–6 is a one-time, pay-what-you-want payment with a $2.00 USD minimum, processed securely by Stripe. We never see or store your card details.</li>
          <li>A portion of every payment supports Ukraine humanitarian relief; the remainder covers the cost of developing, hosting, and operating this site. We don&apos;t represent a fixed percentage split or a named recipient organization, and the site itself is not a registered charity.</li>
          <li>Payments are final and non-refundable, except where required by applicable law or at our discretion.</li>
        </ul>

        <h2 className={h2}>5. Acceptable use</h2>
        <p className={p}>You agree not to:</p>
        <ul className={ul}>
          <li>circumvent payment or access controls;</li>
          <li>disrupt, abuse, or reverse-engineer the game or site beyond what&apos;s legally permitted;</li>
          <li>use the site for any unlawful purpose.</li>
        </ul>
        <p className={p}>We may suspend or terminate accounts that violate these terms.</p>

        <h2 className={h2}>6. Intellectual property</h2>
        <p className={p}>
          The game, its assets, code, and content are owned by us or licensed to us, and are provided for your personal, non-commercial use. You may not redistribute, resell, or copy the game or its assets.
        </p>

        <h2 className={h2}>7. Disclaimers</h2>
        <p className={p}>
          The site and game are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or implied. We don&apos;t guarantee the site will be uninterrupted, secure, or error-free.
        </p>

        <h2 className={h2}>8. Limitation of liability</h2>
        <p className={p}>
          To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the site or game. Our total liability for any claim is limited to the amount you paid us in the twelve months before the claim arose.
        </p>

        <h2 className={h2}>9. Changes to these terms</h2>
        <p className={p}>
          We may update these Terms from time to time. Continued use of the site after changes take effect means you accept the updated Terms.
        </p>

        <h2 className={h2}>10. Governing law</h2>
        <p className={p}>
          These Terms are governed by the laws of the Province of Alberta, Canada, without regard to conflict-of-law principles. Disputes arising from these Terms or your use of the site are subject to the exclusive jurisdiction of the courts of Alberta, Canada.
        </p>

        <h2 className={h2}>11. Contact</h2>
        <p className={p}>
          Questions about these Terms: <a href="mailto:medfixation@gmail.com" className="text-[#7bbeff] underline">medfixation@gmail.com</a>
        </p>

        <div className="h-1 mt-10" style={{ background: 'linear-gradient(90deg, #0057b7 0%, #ffd700 100%)', borderRadius: 2 }} />
      </div>
    </div>
  )
}
