// Route health checks for the Reports page: finds everything about a route
// that needs an admin's attention and ranks routes so the worst come first.
// Pure functions — the page supplies the data (and the travel-time estimates).

import { choosesDropOffFor, choosesPickupFor, daysLabel, formatTime, fromMinutes, passengerChoice, routeDays, sharesDay, toMinutes, vehicleLabel, waitOf } from './routePlans.js'

export const SEVERITIES = [
  { value: 'critical', label: 'Critical', rank: 3 },
  { value: 'warning', label: 'Warning', rank: 2 },
  { value: 'info', label: 'Minor', rank: 1 },
]
const RANK = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.rank]))

export const CATEGORIES = [
  { value: 'schedule', label: 'Schedule vs traffic' },
  { value: 'qr', label: 'QR code' },
  { value: 'assignment', label: 'Vehicle & staff' },
  { value: 'passengers', label: 'Passengers' },
  { value: 'vehicle', label: 'Vehicle documents' },
]

// Minutes late before a stop is flagged, and idle time worth mentioning.
export const THRESHOLDS = { lateWarning: 5, lateCritical: 15, idleInfo: 20 }

function lateSeverity(minutes) {
  if (minutes >= THRESHOLDS.lateCritical) return 'critical'
  if (minutes >= THRESHOLDS.lateWarning) return 'warning'
  return null
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// ---- Schedule -------------------------------------------------------------
// Simulates a run of the route: the bus starts at the first stop's time, and
// at every stop waits its wait time (but never leaves before the scheduled
// time), then drives the next leg. legSeconds[i] = drive from stop i to i+1.
// Returns [{ stop, scheduled, expected, diff, idle }] in minutes after midnight
// (diff > 0 = late), or null without leg times.
export function simulateSchedule(stops, legSeconds) {
  if (!legSeconds || legSeconds.length !== stops.length - 1) return null
  const rows = []
  let arrival = toMinutes(stops[0].time)
  stops.forEach((stop, i) => {
    const scheduled = toMinutes(stop.time)
    const diff = Math.round(arrival - scheduled)
    rows.push({ stop, scheduled, expected: arrival, diff, idle: Math.max(0, -diff) })
    if (i < stops.length - 1) {
      const departure = Math.max(arrival, scheduled) + waitOf(stop)
      arrival = departure + legSeconds[i] / 60
    }
  })
  return rows
}

function scheduleIssues(rows, live) {
  const source = live ? 'with live traffic' : 'at typical traffic'
  if (!rows) {
    return [{ severity: 'info', category: 'schedule', message: 'Travel times could not be estimated, so the schedule wasn\'t checked.' }]
  }
  const issues = []
  const late = rows.filter((r) => lateSeverity(r.diff))
  if (late.length) {
    const worst = late.reduce((a, b) => (b.diff > a.diff ? b : a))
    const last = rows.at(-1)
    const parts = [`${worst.stop.name} ${worst.diff} min late`]
    if (last !== worst && lateSeverity(last.diff)) parts.push(`the destination ${last.diff} min late`)
    issues.push({
      severity: lateSeverity(worst.diff),
      category: 'schedule',
      message: `Expected to reach ${parts.join(' and ')} ${source}${late.length > 1 ? ` (${plural(late.length, 'stop')} behind schedule)` : ''}. Allow more time between stops or shorten the waits.`,
      action: { label: 'Edit schedule', kind: 'edit' },
    })
  }
  const idle = rows.filter((r) => r.idle >= THRESHOLDS.idleInfo)
  if (idle.length) {
    const most = idle.reduce((a, b) => (b.idle > a.idle ? b : a))
    issues.push({
      severity: 'info',
      category: 'schedule',
      message: `The bus would arrive ${Math.round(most.idle)} min early at ${most.stop.name} ${source}. The schedule may be too loose.`,
      action: { label: 'Edit schedule', kind: 'edit' },
    })
  }
  return issues
}

// ---- Completed trips -------------------------------------------------------
// A trip record (data/trips.js) keeps the stops, driver and vehicle it actually
// ran with, so later edits to the route don't rewrite history.

export function formatTripDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// [{ stop, scheduled, actual, diff }] — minutes after midnight; actual/diff null if not recorded.
export function tripStopRows(trip, stops) {
  return stops.map((stop) => {
    const at = trip.stopArrivals[stop.id]
    const actual = at ? toMinutes(at) : null
    const scheduled = toMinutes(stop.time)
    return { stop, scheduled, actual, diff: actual === null ? null : actual - scheduled }
  })
}

function tripFindings(trip, stops, users) {
  const issues = []
  const rows = tripStopRows(trip, stops)
  const late = rows.filter((r) => r.diff !== null && lateSeverity(r.diff))
  if (late.length) {
    const worst = late.reduce((x, y) => (y.diff > x.diff ? y : x))
    issues.push({
      severity: lateSeverity(worst.diff),
      category: 'trip',
      message: `Late at ${plural(late.length, 'stop')}: ${late.map((r) => `${r.stop.name} +${r.diff} min`).join(', ')}.`,
    })
  }
  const missed = rows.filter((r) => r.actual === null)
  if (missed.length) {
    issues.push({ severity: 'warning', category: 'trip', message: `No arrival recorded at ${missed.map((r) => r.stop.name).join(', ')} — the stop may have been skipped.` })
  }
  for (const alert of trip.dropOffAlerts) {
    const who = users.find((u) => u.id === alert.userId)?.name ?? 'A passenger'
    issues.push({ severity: alert.type === 'not-on-route' ? 'warning' : 'critical', category: 'trip', message: `${who}: ${alert.message}` })
  }
  const noShows = (trip.passengers ?? []).filter((p) => p.state === 'not-boarded')
  if (noShows.length) {
    issues.push({ severity: 'info', category: 'trip', message: `${plural(noShows.length, 'assigned passenger')} didn't board.` })
  }
  return issues.sort((x, y) => RANK[y.severity] - RANK[x.severity])
}

// ctx: { routes, users, vehicles }
export function buildTripReport(trip, ctx) {
  const route = ctx.routes.find((r) => r.id === trip.routeId) ?? null
  const stops = trip.stops ?? route?.stops ?? []
  const issues = tripFindings(trip, stops, ctx.users)
  const worst = issues[0]?.severity ?? null
  const rows = tripStopRows(trip, stops)
  return {
    trip, route, stops, rows, issues, worst,
    rank: worst ? RANK[worst] : 0,
    routeName: route?.name ?? trip.routeName ?? 'Deleted route',
    driver: ctx.users.find((u) => u.id === trip.driverId) ?? null,
    vehicle: ctx.vehicles.find((v) => v.id === trip.vehicleId) ?? null,
    arrival: rows.at(-1) ?? null,
  }
}

// Problem trips first (worst first), then newest first.
export function sortTripReports(reports) {
  return [...reports].sort((a, b) => b.rank - a.rank || b.trip.date.localeCompare(a.trip.date) || a.routeName.localeCompare(b.routeName))
}

// ---- Vehicle, staff & conflicts --------------------------------------------
function timeWindow(route) {
  const times = route.stops.map((s) => toMinutes(s.time))
  return times.length ? [Math.min(...times), Math.max(...times)] : null
}
const overlaps = (a, b) => a && b && a[0] < b[1] && b[0] < a[1]

function assignmentIssues(route, vehicle, driver, supervisor, allRoutes) {
  const issues = []
  if (!vehicle) issues.push({ severity: 'critical', category: 'assignment', message: 'The vehicle was removed. Assign another one.', action: { label: 'Choose vehicle', kind: 'edit' } })
  if (!driver) issues.push({ severity: 'critical', category: 'assignment', message: 'The driver was removed. Assign another one.', action: { label: 'Choose driver', kind: 'edit' } })
  if (!route.supervisorId) issues.push({ severity: 'info', category: 'assignment', message: 'No supervisor assigned.', action: { label: 'Add supervisor', kind: 'edit' } })
  else if (!supervisor) issues.push({ severity: 'warning', category: 'assignment', message: 'The supervisor was removed.', action: { label: 'Add supervisor', kind: 'edit' } })

  const mine = timeWindow(route)
  for (const other of allRoutes) {
    // Only a clash if both run on at least one common day at overlapping times.
    if (other.id === route.id || !sharesDay(route, other) || !overlaps(mine, timeWindow(other))) continue
    const commonDays = daysLabel(routeDays(route).filter((d) => routeDays(other).includes(d)))
    const span = `${commonDays}, ${formatTime(fromMinutes(timeWindow(other)[0]))}–${formatTime(fromMinutes(timeWindow(other)[1]))}`
    if (driver && other.driverId === route.driverId) {
      issues.push({ severity: 'warning', category: 'assignment', message: `${driver.name} also drives "${other.name}" at an overlapping time (${span}).`, action: { label: 'Change driver', kind: 'edit' } })
    }
    if (vehicle && other.vehicleId === route.vehicleId) {
      issues.push({ severity: 'warning', category: 'assignment', message: `Vehicle ${vehicle.plate} is also on "${other.name}" at an overlapping time (${span}).`, action: { label: 'Change vehicle', kind: 'edit' } })
    }
  }
  if (supervisor) {
    for (const other of allRoutes) {
      if (other.id !== route.id && other.supervisorId === route.supervisorId && sharesDay(route, other) && overlaps(mine, timeWindow(other))) {
        issues.push({ severity: 'info', category: 'assignment', message: `${supervisor.name} also supervises "${other.name}" at an overlapping time.` })
      }
    }
  }
  return issues
}

function vehicleIssues(vehicle) {
  if (!vehicle) return []
  const issues = []
  const fix = { label: 'Open Fleet', kind: 'link', to: '/fleet' }
  if (!vehicle.licenseFile) issues.push({ severity: 'warning', category: 'vehicle', message: `Vehicle ${vehicle.plate} has no license uploaded.`, action: fix })
  if (!vehicle.photos?.length) issues.push({ severity: 'info', category: 'vehicle', message: `Vehicle ${vehicle.plate} has no photos.`, action: fix })
  return issues
}

// ---- Passengers -------------------------------------------------------------
function passengerIssues(route, vehicle, users) {
  const list = route.passengers ?? []
  const fix = { label: 'Edit passengers', kind: 'edit' }
  if (!list.length) return [{ severity: 'info', category: 'passengers', message: 'No passengers on this route yet.', action: fix }]
  const issues = []
  if (vehicle && list.length > vehicle.capacity) {
    issues.push({ severity: 'critical', category: 'passengers', message: `${plural(list.length, 'passenger')} but ${vehicleLabel(vehicle)} only has ${vehicle.capacity} seats.`, action: fix })
  }
  const records = list.map((p) => ({ p, user: users.find((u) => u.id === p.userId) }))
  const removed = records.filter((r) => !r.user).length
  if (removed) issues.push({ severity: 'warning', category: 'passengers', message: `${plural(removed, 'assigned passenger')} no longer exist${removed === 1 ? 's' : ''}.`, action: fix })
  const unsubscribed = records.filter((r) => r.user && r.user.status !== 'subscribed')
  if (unsubscribed.length) {
    issues.push({ severity: 'warning', category: 'passengers', message: `Unsubscribed but still assigned: ${unsubscribed.map((r) => r.user.name).join(', ')}.`, action: fix })
  }
  const choice = passengerChoice(route)
  const notChosen = list.filter((p) => (choosesPickupFor(choice) && !p.pickupStopId) || (choosesDropOffFor(choice) && !p.dropOffStopId)).length
  if (notChosen) {
    const who = notChosen === 1 ? "1 passenger hasn't" : `${notChosen} passengers haven't`
    issues.push({ severity: 'info', category: 'passengers', message: `${who} chosen their stop${choice === 'both' ? 's' : ''} in the app yet.` })
  }
  return issues
}

// ---- QR ---------------------------------------------------------------------
function qrIssues(qrState) {
  const fix = { label: 'Open QR', kind: 'link', to: '/qr' }
  switch (qrState?.state) {
    case 'none': return [{ severity: 'warning', category: 'qr', message: 'No boarding QR code yet.', action: fix }]
    case 'expired': return [{ severity: 'critical', category: 'qr', message: 'The boarding QR code has expired — passengers can\'t board with it.', action: fix }]
    case 'revoked': return [{ severity: 'critical', category: 'qr', message: 'The boarding QR code was revoked — passengers can\'t board with it.', action: fix }]
    case 'outdated': return [{ severity: 'warning', category: 'qr', message: 'The QR code was generated before the route changed.', action: fix }]
    default: return []
  }
}

// ---- Report -----------------------------------------------------------------
// Problems with the route itself (not with past trips — those are on Reports).
// ctx: { vehicles, users, allRoutes, qrState, typicalLegs, liveLegs }
// liveLegs (if checked) is preferred over typicalLegs for the schedule check.
export function buildRouteReport(route, ctx) {
  const vehicle = ctx.vehicles.find((v) => v.id === route.vehicleId) ?? null
  const driver = ctx.users.find((u) => u.id === route.driverId && u.type === 'driver') ?? null
  const supervisor = ctx.users.find((u) => u.id === route.supervisorId && u.type === 'supervisor') ?? null

  const typical = simulateSchedule(route.stops, ctx.typicalLegs)
  const live = simulateSchedule(route.stops, ctx.liveLegs)
  const pending = ctx.typicalLegs === undefined && !live

  const issues = [
    ...(pending ? [] : scheduleIssues(live ?? typical, !!live)),
    ...qrIssues(ctx.qrState),
    ...assignmentIssues(route, vehicle, driver, supervisor, ctx.allRoutes),
    ...passengerIssues(route, vehicle, ctx.users),
    ...vehicleIssues(vehicle),
  ].sort((a, b) => RANK[b.severity] - RANK[a.severity])

  const worst = issues[0]?.severity ?? null
  return {
    route, vehicle, driver, supervisor, issues, worst,
    rank: worst ? RANK[worst] : 0,
    schedule: { typical, live, pending },
    arrival: (live ?? typical)?.at(-1) ?? null,
  }
}

// Worst first, then most issues at that level, then most issues, then by name.
const atWorst = (r) => r.issues.filter((i) => i.severity === r.worst).length
export function sortReports(reports) {
  return [...reports].sort((a, b) =>
    b.rank - a.rank ||
    atWorst(b) - atWorst(a) ||
    b.issues.length - a.issues.length ||
    a.route.name.localeCompare(b.route.name))
}

// Home page order — the route's state comes first:
//   1. active and needs fixing   2. active and fine
//   3. inactive and needs fixing 4. inactive and fine
// then worst problem first, then name. `route.active` is set while a trip
// is running (by the backend / driver app).
const stateGroup = (r) => (r.route.active ? 0 : 2) + (r.worst && r.worst !== 'info' ? 0 : 1)
export function sortForHome(reports) {
  return [...reports].sort((a, b) =>
    stateGroup(a) - stateGroup(b) ||
    b.rank - a.rank ||
    atWorst(b) - atWorst(a) ||
    a.route.name.localeCompare(b.route.name))
}
