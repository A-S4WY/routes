// Automatic drop-off detection.
//
// Works out where each passenger got off from what a trip already records:
//   - boardings: QR scans when passengers get on, and
//   - bus GPS positions (from the driver app).
// Each passenger on a route has an assigned drop-off stop. When the bus
// stops there (stays near it for a while) and then drives away, everyone on
// board who was due to get off there is marked as dropped off.
//
// Pure functions, no browser APIs, so the same logic can run on the backend
// once a live GPS feed exists.
// TODO: run this server-side against real trip data (driver app GPS + QR scans).

// Tuning — distances in metres, times in milliseconds.
export const DROP_OFF_RULES = {
  arriveRadius: 60, // bus counts as "at the stop" inside this distance
  departRadius: 120, // ...and as "left the stop" once beyond this distance
  minDwell: 15_000, // must stay at least this long to count as a real stop
}

// Great-circle distance in metres between two { lat, lng } points.
export function distanceMeters(a, b) {
  const R = 6_371_000
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Turns a time-ordered list of bus positions into stop visits:
// [{ stopId, arrivedAt, departedAt, dwell, skipped }]. A pass-through without
// stopping long enough is reported with skipped: true.
export function detectStopVisits(stops, positions, rules = DROP_OFF_RULES) {
  const visits = []
  let current = null // { stopId, arrivedAt, lastNearAt }

  for (const pos of positions) {
    if (current) {
      const stop = stops.find((s) => s.id === current.stopId)
      const d = distanceMeters(pos, stop.location)
      if (d <= rules.departRadius) {
        if (d <= rules.arriveRadius) current.lastNearAt = pos.at
        continue
      }
      // Bus has driven away from the stop.
      const dwell = current.lastNearAt - current.arrivedAt
      visits.push({
        stopId: current.stopId,
        arrivedAt: current.arrivedAt,
        departedAt: pos.at,
        dwell,
        skipped: dwell < rules.minDwell,
      })
      current = null
    }
    const near = stops.find((s) => distanceMeters(pos, s.location) <= rules.arriveRadius)
    if (near) current = { stopId: near.id, arrivedAt: pos.at, lastNearAt: pos.at }
  }

  // Trip data ended while still at a stop (e.g. parked at the destination).
  if (current) {
    const dwell = current.lastNearAt - current.arrivedAt
    visits.push({ stopId: current.stopId, arrivedAt: current.arrivedAt, departedAt: null, dwell, skipped: false })
  }
  return visits
}

// route:  { stops: [{ id, name, location }], passengers: [{ userId, dropOffStopId|null }] }
//         dropOffStopId is null until a passenger who picks their own drop-off does so.
// trip:   { boardings: [{ userId, at }], positions: [{ at, lat, lng }], endedAt|null }
//
// Returns:
//   passengers: { [userId]: { state, boardedAt, droppedAt, stopId, method } }
//     state: 'not-boarded' | 'on-board' | 'dropped' | 'unconfirmed'
//     method: 'auto-gps' when the drop-off was inferred from the bus position
//   visits: detectStopVisits() output
//   alerts: [{ type, userId?, stopId?, message }] for the supervisor / admin
//     'stop-skipped'    bus passed someone's drop-off stop without stopping
//     'unconfirmed'     trip ended with the passenger still marked on board
//     'not-on-route'    someone boarded who isn't assigned to this route
export function inferDropOffs(route, trip, rules = DROP_OFF_RULES) {
  const stopName = (id) => (id ? route.stops.find((s) => s.id === id)?.name ?? 'an unknown stop' : null)
  const assigned = new Map(route.passengers.map((p) => [p.userId, p]))
  const alerts = []

  const result = {}
  for (const p of route.passengers) {
    result[p.userId] = { state: 'not-boarded', boardedAt: null, droppedAt: null, stopId: p.dropOffStopId, method: null }
  }
  for (const b of trip.boardings) {
    if (!assigned.has(b.userId)) {
      alerts.push({ type: 'not-on-route', userId: b.userId, message: 'Boarded a route they are not assigned to.' })
      continue
    }
    const r = result[b.userId]
    if (r.state === 'not-boarded') Object.assign(r, { state: 'on-board', boardedAt: b.at })
  }

  const visits = detectStopVisits(route.stops, trip.positions, rules)
  for (const visit of visits) {
    if (visit.departedAt === null && !trip.endedAt) continue // still at the stop
    for (const [userId, r] of Object.entries(result)) {
      if (r.stopId !== visit.stopId || r.state !== 'on-board' || r.boardedAt > visit.arrivedAt) continue
      if (visit.skipped) {
        alerts.push({ type: 'stop-skipped', userId, stopId: visit.stopId, message: `The bus passed ${stopName(visit.stopId)} without stopping.` })
        continue
      }
      Object.assign(r, { state: 'dropped', droppedAt: visit.departedAt ?? trip.endedAt, method: 'auto-gps' })
    }
  }

  // Anyone still on board when the trip closes needs a human check
  // (the driver's end-of-trip "bus is empty" confirmation).
  if (trip.endedAt) {
    for (const [userId, r] of Object.entries(result)) {
      if (r.state !== 'on-board') continue
      r.state = 'unconfirmed'
      const where = stopName(r.stopId)
      alerts.push({
        type: 'unconfirmed', userId, stopId: r.stopId,
        message: where
          ? `No drop-off detected at ${where}. Confirm with the driver.`
          : 'No drop-off point was chosen, so it could not be detected. Confirm with the driver.',
      })
    }
  }

  return { passengers: result, visits, alerts }
}
