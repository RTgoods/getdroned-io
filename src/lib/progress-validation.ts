// Tool ids that can legitimately sit in the belt (public/get-droned/assets/js/game.js SHOP, t_-prefix stripped).
// 'god' is included for the hardcoded god-mode account (see canUseGodMode in /api/access).
export const VALID_BELT_IDS = new Set([
  'fullArmour', 'reinforcements', 'droneS', 'drone', 'droneL', 'usv', 'sentry',
  'strike', 'stim', 'smoke', 'incend', 'flamer', 'emp', 'med', 'repair', 'plate', 'god',
])
export const MAX_BELT_SLOTS = 6
export const MAX_KILLS = 2000
export const MAX_SQUAD_LOST = 50
export const MAX_MONEY = 999999
export const MAX_TIME_ALIVE = 7200 // seconds — 2 hours, generous for a single sector attempt

export function isValidStatInput(kills: unknown, squadLost: unknown, moneyEnd: unknown, timeAlive: unknown, belt: unknown): boolean {
  const isBoundedInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max
  if (!isBoundedInt(kills, MAX_KILLS)) return false
  if (!isBoundedInt(squadLost, MAX_SQUAD_LOST)) return false
  if (!isBoundedInt(moneyEnd, MAX_MONEY)) return false
  if (!isBoundedInt(timeAlive, MAX_TIME_ALIVE)) return false
  if (!Array.isArray(belt) || belt.length > MAX_BELT_SLOTS) return false
  if (!belt.every(item => typeof item === 'string' && VALID_BELT_IDS.has(item))) return false
  return true
}
