# AI Games — Setup Guide

Full-stack game storefront: Next.js 15 · Supabase · Stripe · Vercel.

---

## 1 · Install dependencies

```bash
cd AIGames
npm install
```

---

## 2 · Supabase

1. Go to [supabase.com](https://supabase.com) → your project (or create one).
2. **SQL Editor → New query** → paste and run `supabase/migrations/001_init.sql`.
3. Under **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` _(keep this secret — never expose client-side)_
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (dev) / your Vercel URL (prod)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-site.vercel.app/auth/callback`

---

## 3 · Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com).
2. **Developers → API keys** → copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
3. **Webhooks → Add endpoint**:
   - Endpoint URL: `https://your-site.vercel.app/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`
4. **Local testing** — install the Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   The CLI prints a webhook secret starting with `whsec_` — use that locally.

---

## 4 · Environment variables

```bash
cp .env.local.example .env.local
# Fill in all values
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 5 · Set up the Get Droned game files

The play page iframes the game from `/get-droned/index.html`. Next.js serves files from `public/`:

```bash
cp -r get-droned-claudecode/ public/get-droned/
```

The seed data in `001_init.sql` already sets `play_url = '/get-droned/index.html'`.  
If you host the game elsewhere, update that value in the Supabase dashboard.

---

## 6 · Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 7 · Deploy to Vercel

```bash
# One-time
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_SITE_URL  # your https:// URL

vercel --prod
```

After deploy, update `NEXT_PUBLIC_SITE_URL` and the Supabase redirect URL with your production domain.

---

## 8 · Adding new games

Use the Supabase Table Editor (or SQL):

```sql
INSERT INTO games (slug, title, tagline, price_cents, tags, genre, is_published, is_featured, play_url)
VALUES (
  'my-new-game',
  'My New Game',
  'A short tagline.',
  999,              -- $9.99 in cents
  ARRAY['Action'],
  'Action',
  true,
  false,
  '/my-new-game/index.html'  -- copy files to public/my-new-game/
);
```

Set `price_cents = 0` for a free game.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx               ← Home / hero + featured games
│   ├── games/
│   │   ├── page.tsx           ← Store catalog
│   │   └── [slug]/page.tsx    ← Game detail + buy button
│   ├── library/
│   │   ├── page.tsx           ← User's purchased games
│   │   └── [slug]/page.tsx    ← Iframe game player
│   ├── auth/
│   │   ├── login/             ← Sign in / sign up
│   │   └── callback/          ← Supabase auth callback
│   ├── checkout/success/      ← Post-purchase confirmation
│   └── api/stripe/
│       ├── checkout/route.ts  ← Creates Stripe session
│       └── webhook/route.ts   ← Records purchase after payment
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── GameCard.tsx
│   └── BuyButton.tsx
├── lib/
│   ├── supabase/{client,server}.ts
│   └── stripe.ts
└── types/database.ts

supabase/migrations/001_init.sql   ← Schema + RLS + seed
```

## Purchase flow

```
User clicks Buy → /api/stripe/checkout (POST)
  → Creates Stripe Checkout session
  → Redirects user to stripe.com

User pays on Stripe
  → Stripe fires checkout.session.completed webhook
  → /api/stripe/webhook records Purchase in Supabase (status=completed)
  → Stripe redirects user to /checkout/success

User visits /library/[slug]
  → Server checks purchases table
  → If found: renders iframe with game
  → If not: redirects to /games/[slug]
```
