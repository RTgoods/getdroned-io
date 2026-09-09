// Run with: node --env-file=.env.local scripts/create-testing-admin.mjs
// Provide the requested password through stdin; never save it in this file.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key || key === '[SENSITIVE]') throw new Error('Configure Supabase URL and service-role key in .env.local first.')
const password = readFileSync(0, 'utf8').trim()
if (password.length < 12) throw new Error('Supply the admin password through stdin (at least 12 characters).')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const email = 'g00dsman@yahoo.com'
let existing
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 })
  if (error) throw new Error('Unable to list Auth users: ' + error.message)
  existing = data.users.find(u => u.email?.toLowerCase() === email)
  if (existing || data.users.length < 100) break
}
const attributes = { password, email_confirm: true, app_metadata: { ...existing?.app_metadata, role: 'admin' } }
const { error } = existing
  ? await db.auth.admin.updateUserById(existing.id, attributes)
  : await db.auth.admin.createUser({ email, ...attributes })
if (error) throw new Error('Unable to configure testing account: ' + error.message)
console.log('Admin/testing account configured. Sign in and open /admin.')
