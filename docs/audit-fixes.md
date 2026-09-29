# Audit fix rollout

Apply `supabase/migrations/007_audit_reliability.sql` in the Supabase SQL editor **before deploying this application version**. Applied by the project owner on 2026-09-29. Read-only checks against the configured hosted Supabase project confirmed both new columns, the checkout reservation table, and all three RPC functions are exposed. No player or payment records were changed during verification.

The migration preserves purchases and completed sectors. It adds:

- A private checkout reservation table and a service-role-only reservation function.
- Atomic progress-save and reset functions, with a reset version to reject stale completions from other tabs/devices.
- The previously missing `games.rec_enabled` column for fresh installations.

Use `npm test`, `npm run lint`, and `npm run build` to verify the application. The database tests apply all migrations to an isolated PostgreSQL engine (PGlite); they never connect to the hosted database. Checkout tests mock Stripe and do not create payments.

Checkout retries reuse the saved Stripe session and immutable request payload. Changing the amount expires the old session before making a replacement. Paid or processing sessions lead back to payment verification. The confirmation page checks the signed-in owner, Stripe payment status, and the completed purchase record before showing success; delayed webhooks display a pending state.

If Stripe created a session but saving its ID failed, retries use the same idempotency key. An unresolved reservation older than 23 hours fails closed: reconcile it against Stripe using the `checkout:<reservation UUID>` request key before changing it. Never delete an unresolved reservation without confirming its payment/session state.

Existing sessions created by the old code have no reservation. During rollout, reconcile or expire outstanding unpaid legacy checkout sessions in Stripe before reopening checkout, so those old links cannot be paid alongside new sessions. Do not expire sessions with completed or pending payments.

Progress resets retain an empty versioned row instead of deleting it. Do not manually delete that row: its version prevents stale queues from recreating old progress. Older clients can save version 0 until the first reset; after a reset, they must reload the updated app.

The patrol-tank test now verifies the existing 65% armour reduction; gameplay damage was not changed.
