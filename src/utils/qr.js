import { QR_BASE_URL } from '../config.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Validity choices when generating a code; days: null = never expires.
export const VALIDITY_OPTIONS = [
  { value: '1', label: '1 day', days: 1 },
  { value: '7', label: '7 days', days: 7 },
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: 'never', label: 'Never expires', days: null },
]

// The parts of a route a printed QR code depends on. If any of them change
// after the code was generated, the code is flagged as needing an update.
export function snapshotRoute(route) {
  return {
    name: route.name,
    vehicleId: route.vehicleId,
    driverId: route.driverId,
    stops: JSON.stringify(route.stops.map(({ name, time, location }) => ({ name, time, location }))),
  }
}

const CHANGE_LABELS = { name: 'name', vehicleId: 'vehicle', driverId: 'driver', stops: 'stops' }

function changedParts(before, after) {
  return Object.keys(CHANGE_LABELS).filter((k) => before[k] !== after[k]).map((k) => CHANGE_LABELS[k])
}

// qr: { routeId, token, generatedAt, expiresAt|null, revokedAt|null, snapshot }
export function createQr(route, validityValue, now = Date.now()) {
  const { days } = VALIDITY_OPTIONS.find((o) => o.value === validityValue)
  return {
    routeId: route.id,
    token: crypto.randomUUID().replaceAll('-', '').slice(0, 16),
    generatedAt: now,
    expiresAt: days ? now + days * DAY_MS : null,
    revokedAt: null,
    snapshot: snapshotRoute(route),
  }
}

export function qrPayload(qr) {
  return `${QR_BASE_URL}/${encodeURIComponent(qr.routeId)}?t=${qr.token}`
}

export function formatDateTime(ms) {
  return new Date(ms).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// state: 'none' | 'active' | 'outdated' | 'expired' | 'revoked'
// reasons: human-readable explanations for anything other than 'active'.
export function qrStatus(qr, route, now = Date.now()) {
  if (!qr) return { state: 'none', label: 'Not generated', reasons: [] }
  if (qr.revokedAt) {
    return { state: 'revoked', label: 'Revoked', reasons: [`Revoked on ${formatDateTime(qr.revokedAt)}. Scanning it no longer works.`] }
  }

  const reasons = []
  const expired = qr.expiresAt !== null && qr.expiresAt <= now
  if (expired) reasons.push(`Expired on ${formatDateTime(qr.expiresAt)}. Scanning it no longer works.`)

  const changes = changedParts(qr.snapshot, snapshotRoute(route))
  if (changes.length) {
    reasons.push(`The route's ${changes.join(', ')} changed after this code was generated, so it may point passengers to outdated details.`)
  }

  if (expired) return { state: 'expired', label: 'Expired', reasons }
  if (changes.length) return { state: 'outdated', label: 'Needs update', reasons }
  return { state: 'active', label: 'Active', reasons }
}

export const QR_STATES = [
  { value: 'active', label: 'Active' },
  { value: 'outdated', label: 'Needs update' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'none', label: 'Not generated' },
]
