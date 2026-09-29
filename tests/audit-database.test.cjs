const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PGlite } = require('@electric-sql/pglite')

test('database migration: atomic progress, reset versions, checkout reservations, permissions', async t => {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';`)
    for (const file of fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) {
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, 'utf8'))
    }
    const user = '00000000-0000-0000-0000-000000000001'
    await db.query('INSERT INTO auth.users VALUES ($1)', [user])
    const game = (await db.query("SELECT id FROM games WHERE slug = 'get-droned'")).rows[0].id
    const stat = kills => ({ kills, squadLost: 0, moneyEnd: kills * 10, timeAlive: 30, belt: [], completedAt: new Date().toISOString() })
    const save = async (sector, kills, version = 0, admin = false) => (await db.query(
      'SELECT save_sector_progress($1, $2, $3, $4, $5, $6) AS result', [user, game, sector, stat(kills), version, admin])).rows[0].result
    await t.test('rejects skipped sectors and preserves merged sectors and best stats', async () => {
      assert.equal((await save(2, 10)).error, 'previous_sector_required')
      await save(1, 30)
      await Promise.all([save(2, 20), save(1, 5)])
      const row = (await db.query('SELECT * FROM progress')).rows[0]
      assert.deepEqual(row.completed_sectors, [1, 2])
      assert.equal(row.sector_stats['1'].kills, 30)
      assert.equal(row.sector_stats['2'].kills, 20)
      const replay = await save(1, 1)
      assert.equal(replay.carryMoney, 300)
    })
    await t.test('reset rejects late saves and permits a new campaign', async () => {
      const reset = (await db.query('SELECT reset_sector_progress($1, $2) AS result', [user, game])).rows[0].result
      assert.equal(reset.resetVersion, 1)
      assert.equal((await save(1, 50)).error, 'stale_progress')
      assert.deepEqual((await db.query('SELECT completed_sectors FROM progress')).rows[0].completed_sectors, [])
      assert.deepEqual((await save(1, 4, 1)).completedSectors, [1])
    })
    await t.test('checkout reservations share one key and immutable payload', async () => {
      const reserve = async amount => (await db.query('SELECT reserve_checkout($1, $2, $3) AS result', [user, game, { amount }])).rows[0].result
      const [first, second] = await Promise.all([reserve(200), reserve(500)])
      assert.equal(first.id, second.id)
      assert.deepEqual(first.params, second.params)
      await db.query("INSERT INTO purchases(user_id, game_id, status) VALUES ($1, $2, 'completed')", [user, game])
      assert.equal((await reserve(200)).error, 'already_purchased')
    })
    await t.test('only the service role can execute write functions or read reservations', async () => {
      for (const signature of ['reserve_checkout(uuid,uuid,jsonb)', 'save_sector_progress(uuid,uuid,integer,jsonb,integer,boolean)', 'reset_sector_progress(uuid,uuid)']) {
        const { rows } = await db.query(`SELECT has_function_privilege('anon', $1, 'EXECUTE') AS anon,
          has_function_privilege('authenticated', $1, 'EXECUTE') AS authenticated,
          has_function_privilege('service_role', $1, 'EXECUTE') AS service`, [signature])
        assert.deepEqual(rows[0], { anon: false, authenticated: false, service: true })
      }
      assert.equal((await db.query("SELECT has_table_privilege('authenticated', 'checkout_attempts', 'SELECT') AS allowed")).rows[0].allowed, false)
    })
  } finally { await db.close() }
})
