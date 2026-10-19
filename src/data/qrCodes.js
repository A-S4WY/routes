// Static placeholder QR codes, one per route at most. Swap for a real API
// call later, e.g. fetch('/api/qr-codes'). Dates are relative to page load
// so the demo always shows one active and one expired code.
import { ROUTE_PLANS } from './routePlans.js'
import { snapshotRoute } from '../utils/qr.js'

const DAY_MS = 24 * 60 * 60 * 1000
const now = Date.now()
const [r1, r2] = ROUTE_PLANS

export const QR_CODES = [
  {
    routeId: r1.id,
    token: '4f1c9a2be07d6c35',
    generatedAt: now - 3 * DAY_MS,
    expiresAt: now + 27 * DAY_MS,
    revokedAt: null,
    snapshot: snapshotRoute(r1),
  },
  {
    routeId: r2.id,
    token: '9b03e7d14a6f2c88',
    generatedAt: now - 40 * DAY_MS,
    expiresAt: now - 10 * DAY_MS,
    revokedAt: null,
    snapshot: snapshotRoute(r2),
  },
]
