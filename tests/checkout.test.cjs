const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript')
function load(file) {
  const exports = {}
  new Function('exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(exports)
  return exports
}
const { checkoutSession } = load('src/lib/checkout-session.ts')
const { checkoutStatus } = load('src/lib/checkout-status.ts')
const params = { success_url: 'https://example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}', line_items: [{ price_data: { unit_amount: 200 } }] }
function setup() {
  let reservation, next = 0, creates = [], expires = [], status = 'open', amount = 200, failSave = false
  const db = {
    async rpc(name, args) {
      reservation ||= { id: String(++next), created_at: new Date().toISOString(), params: args.p_params }
      return { data: { ...reservation } }
    },
    from() { return {
      update(value) { return { async eq() { if (failSave) return { error: {} }; Object.assign(reservation, value); return {} } } },
      delete() { return { async eq(key, id) { if (reservation.id === id) reservation = null; return {} } } },
    } },
  }
  const sessions = {
    async create(payload, options) { creates.push({ payload, options }); return { id: 'cs_' + options.idempotencyKey, status: 'open' } },
    async retrieve(id) { return { id, status, payment_status: status === 'complete' ? 'paid' : 'unpaid', amount_total: amount, url: 'https://checkout.stripe.com/' + id } },
    async expire(id) { expires.push(id); amount = 500 },
  }
  return { db, stripe: { checkout: { sessions } }, creates, expires,
    setStatus: s => status = s, failSave: v => failSave = v,
    ageReservation: () => reservation.created_at = '2020-01-01T00:00:00Z' }
}
test('checkout reuses one payable session across retries', async () => {
  const x = setup()
  const first = await checkoutSession(x.db, x.stripe, 'u', 'g', params)
  assert.deepEqual(await checkoutSession(x.db, x.stripe, 'u', 'g', params), first)
  assert.equal(x.creates.length, 1)
})
test('uncertain persistence retries use the same Stripe key and payload', async () => {
  const x = setup(); x.failSave(true)
  await assert.rejects(checkoutSession(x.db, x.stripe, 'u', 'g', params))
  x.failSave(false)
  await checkoutSession(x.db, x.stripe, 'u', 'g', params)
  assert.deepEqual(x.creates[0], x.creates[1])
})
test('concurrent checkout requests share a Stripe idempotency key', async () => {
  const x = setup()
  const result = await Promise.all([checkoutSession(x.db, x.stripe, 'u', 'g', params), checkoutSession(x.db, x.stripe, 'u', 'g', params)])
  assert.deepEqual(result[0], result[1])
  assert.equal(new Set(x.creates.map(c => c.options.idempotencyKey)).size, 1)
})
test('changing amount expires the existing checkout before replacement', async () => {
  const x = setup()
  await checkoutSession(x.db, x.stripe, 'u', 'g', params)
  await checkoutSession(x.db, x.stripe, 'u', 'g', { ...params, line_items: [{ price_data: { unit_amount: 500 } }] })
  assert.equal(x.expires.length, 1)
  assert.equal(x.creates.length, 2)
  assert.notEqual(x.creates[0].options.idempotencyKey, x.creates[1].options.idempotencyKey)
})
test('paid sessions go to verification instead of creating another checkout', async () => {
  const x = setup()
  await checkoutSession(x.db, x.stripe, 'u', 'g', params)
  x.setStatus('complete')
  assert.match((await checkoutSession(x.db, x.stripe, 'u', 'g', params)).url, /checkout\/success\?session_id=/)
  assert.equal(x.creates.length, 1)
})
test('uncertain sessions older than the idempotency window fail closed', async () => {
  const x = setup(); x.failSave(true)
  await assert.rejects(checkoutSession(x.db, x.stripe, 'u', 'g', params))
  x.ageReservation(); x.failSave(false)
  await assert.rejects(checkoutSession(x.db, x.stripe, 'u', 'g', params), /verification/)
  assert.equal(x.creates.length, 1)
})
test('confirmation requires session ownership, payment and entitlement', async () => {
  const session = { metadata: { userId: 'u', gameId: 'g' }, payment_status: 'paid', status: 'complete' }
  let owned = false
  const db = { from() { const q = { select() { return q }, eq() { return q }, async maybeSingle() { return { data: owned ? { id: 'p' } : null } } }; return q } }
  const stripe = { checkout: { sessions: { async retrieve() { return session } } } }
  assert.equal(await checkoutStatus(db, stripe, 'someone-else', 'cs'), 'invalid')
  assert.equal(await checkoutStatus(db, stripe, 'u', 'cs'), 'pending')
  owned = true
  assert.equal(await checkoutStatus(db, stripe, 'u', 'cs'), 'confirmed')
  session.payment_status = 'unpaid'
  assert.equal(await checkoutStatus(db, stripe, 'u', 'cs'), 'pending')
  session.status = 'open'
  assert.equal(await checkoutStatus(db, stripe, 'u', 'cs'), 'unpaid')
})
