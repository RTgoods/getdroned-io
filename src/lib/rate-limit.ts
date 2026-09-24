import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null

if (!redis) {
  // Fails open rather than breaking the app when Upstash isn't configured (e.g. local dev).
  console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled')
}

function limiter(prefix: string, limit: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix: `ratelimit:${prefix}`, analytics: false })
}

// Gates every request the middleware handles (nearly the whole site), by IP —
// the single highest-leverage limit, since it runs before any Supabase Auth call.
export const middlewareLimiter = limiter('mw', 120, '60 s')

// Per-user limits on our own API routes, defense-in-depth behind the middleware gate.
export const checkoutLimiter = limiter('checkout', 6, '5 m')
export const accessLimiter = limiter('access', 30, '60 s')
export const progressLimiter = limiter('progress', 30, '60 s')
export const profileLimiter = limiter('profile', 20, '60 s')

export async function checkLimit(rl: Ratelimit | null, key: string) {
  if (!rl) return { success: true }
  return rl.limit(key)
}
