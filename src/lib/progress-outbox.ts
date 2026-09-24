export type Completion = {
  gameId: string; sector: number; kills: number; squadLost: number;
  moneyEnd: number; timeAlive: number; belt: string[];
}
export const progressQueueKey = (userId: string, gameId: string) => `gd:pending-progress:${userId}:${gameId}`

// Serial writes keep sector unlocks in order. Failed writes stay queued across reloads.
export function createProgressOutbox(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key: string,
  send: (entry: Completion) => Promise<void>,
  status: (message: string) => void,
) {
  let queue: Completion[] = []
  try { queue = JSON.parse(storage.getItem(key) || '[]'); if (!Array.isArray(queue)) queue = [] } catch { queue = [] }
  let running = false, stopped = false
  const persist = () => { try { storage.setItem(key, JSON.stringify(queue)); return true } catch { return false } }
  async function flush() {
    if (running || stopped || !queue.length) return
    running = true
    status('Saving sector progress…')
    try {
      while (queue.length && !stopped) {
        const entry = [...queue].sort((a, b) => a.sector - b.sector)[0]
        await send(entry)
        if (stopped) return
        queue.splice(queue.indexOf(entry), 1); persist()
      }
      if (!stopped) status('Progress saved')
    } catch {
      if (!stopped) status('Progress pending — keep this page open. Retrying automatically.')
    } finally { running = false }
  }
  return {
    flush,
    enqueue(entry: Completion) {
      // Completion can be emitted by both the solved card and its transition.
      if (!queue.some(item => JSON.stringify(item) === JSON.stringify(entry))) queue.push(entry)
      if (!persist()) status('Local saving unavailable — keep this page open until progress is saved.')
      void flush()
    },
    stop() { stopped = true },
  }
}
