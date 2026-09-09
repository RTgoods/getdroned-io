const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const output = ts.transpileModule(fs.readFileSync('src/lib/game-access.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const exportsObject = {}
new Function('exports', output)(exportsObject)
const { gameAccess, isGameAdmin } = exportsObject
function database({ paid = false, failed = false, missingGame = false } = {}) {
  return { from(table) {
    const filters = {}
    const query = {
      select() { return query }, eq(key, value) { filters[key] = value; return query },
      async single() { assert.equal(filters.slug, 'get-droned'); return { data: missingGame ? null : { id: 'real-game-id' }, error: missingGame ? {} : null } },
      async maybeSingle() {
        assert.equal(table, 'purchases'); assert.equal(filters.user_id, 'user-id'); assert.equal(filters.game_id, 'real-game-id'); assert.equal(filters.status, 'completed')
        return { data: paid ? { id: 'purchase' } : null, error: failed ? {} : null }
      }
    }
    return query
  } }
}
const user = { id: 'user-id', app_metadata: {} }
test('logged-out and unpaid players cannot play', async () => {
  assert.equal((await gameAccess(database(), null)).allowed, false)
  assert.equal((await gameAccess(database(), user)).allowed, false)
})
test('completed purchase for the current user and real game grants access', async () => {
  assert.equal((await gameAccess(database({ paid: true }), user)).allowed, true)
})
test('purchase errors and missing catalog fail closed', async () => {
  assert.equal((await gameAccess(database({ paid: true, failed: true }), user)).allowed, false)
  assert.equal((await gameAccess(database({ missingGame: true }), user)).allowed, false)
})
test('only trusted app metadata grants admin access', async () => {
  assert.equal(isGameAdmin({ ...user, user_metadata: { role: 'admin' }, email: 'g00dsman@yahoo.com' }), false)
  assert.equal((await gameAccess(database(), { ...user, app_metadata: { role: 'admin' } })).allowed, true)
})
const { NextRequest, NextResponse } = require('next/server')
async function requestAs(user, paid, path) {
  const middlewareExports = {}
  const db = database({ paid })
  db.auth = { getUser: async () => ({ data: { user } }) }
  const middlewareCode = ts.transpileModule(fs.readFileSync('src/middleware.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('exports', 'require', middlewareCode)(middlewareExports, name => {
    if (name === './lib/game-access') return exportsObject
    if (name === '@supabase/ssr') return { createServerClient: () => db }
    if (name === 'next/server') return { NextResponse }
    throw new Error('Unexpected import: ' + name)
  })
  return middlewareExports.middleware(new NextRequest('https://example.com' + path))
}
test('direct HTML and script URLs enforce authentication and purchase', async () => {
  for (const path of ['/get-droned/index.html?autostart=1', '/get-droned/assets/js/game.js?v=109']) {
    assert.equal((await requestAs(null, false, path)).status, 307)
    assert.equal((await requestAs(user, false, path)).status, 403)
    const response = await requestAs(user, true, path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
})
test('paid players can select levels; boss shortcuts and admin page remain admin-only', async () => {
  assert.equal((await requestAs(user, true, '/admin')).status, 403)
  for (let level = 1; level <= 6; level++) {
    assert.equal((await requestAs(user, true, '/get-droned/index.html?autostart=' + level)).status, 200)
    assert.equal((await requestAs(user, false, '/get-droned/index.html?autostart=' + level)).status, 403)
  }
  assert.equal((await requestAs(user, true, '/get-droned/index.html?boss=6')).status, 403)
  const redirect = await requestAs(user, true, '/get-droned/index.html?autostart=99')
  assert.equal(new URL(redirect.headers.get('location')).searchParams.get('autostart'), '1')
  const admin = { ...user, app_metadata: { role: 'admin' } }
  assert.equal((await requestAs(admin, false, '/admin')).status, 200)
  assert.equal((await requestAs(admin, false, '/get-droned/index.html?autostart=6')).status, 200)
})
