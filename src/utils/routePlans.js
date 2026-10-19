// Helpers shared by Route Setup, the route edit page and Route Management.

// "07:30" -> "7:30 AM"
export function formatTime(value) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

// Stops are always kept in time order ("HH:MM" strings sort correctly).
export function sortByTime(stops) {
  return [...stops].sort((a, b) => a.time.localeCompare(b.time))
}

// ---- Stop types -----------------------------------------------------------
// Each stop placed by the admin is a pickup point, a drop-off point, or both.
// Stops saved before types existed have no `role` and count as 'both'.
export const STOP_ROLES = [
  { value: 'both', label: 'Pickup & drop-off', short: 'Both' },
  { value: 'pickup', label: 'Pickup only', short: 'Pickup' },
  { value: 'dropoff', label: 'Drop-off only', short: 'Drop-off' },
]
export const stopRole = (stop) => stop?.role ?? 'both'
export const canPickUp = (stop) => stopRole(stop) !== 'dropoff'
export const canDropOff = (stop) => stopRole(stop) !== 'pickup'
export const roleLabel = (stop) => STOP_ROLES.find((r) => r.value === stopRole(stop)).short

// ---- Waiting at stops -----------------------------------------------------
// How long the driver waits at each stop before moving on (whole minutes).
// Stops saved before this existed use the default.
export const DEFAULT_WAIT_MINUTES = 2
export const MAX_WAIT_MINUTES = 60
export const waitOf = (stop) => stop?.waitMinutes ?? DEFAULT_WAIT_MINUTES

// "07:30" -> 450 (minutes after midnight), and back.
export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMinutes = (total) => {
  const m = ((Math.round(total) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// ---- Active days ----------------------------------------------------------
// route.days: weekdays the route runs on, as JS getDay() numbers (0 = Sunday).
// Listed Saturday-first, as the week is shown in Egypt.
export const WEEKDAYS = [
  { value: 6, short: 'Sat', label: 'Saturday' },
  { value: 0, short: 'Sun', label: 'Sunday' },
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
]
export const WORK_WEEK = [0, 1, 2, 3, 4] // Sunday–Thursday
export const EVERY_DAY = WEEKDAYS.map((d) => d.value)
// Routes saved before days existed run Sunday–Thursday.
export const routeDays = (route) => route?.days ?? WORK_WEEK
export const runsOn = (route, date) => routeDays(route).includes(date.getDay())
export const sharesDay = (a, b) => routeDays(a).some((d) => routeDays(b).includes(d))

// "Sun–Thu", "Every day", "Sat, Mon, Wed"
export function daysLabel(days) {
  const set = new Set(days)
  if (set.size === 7) return 'Every day'
  if (set.size === 0) return 'No days'
  const ordered = WEEKDAYS.filter((d) => set.has(d.value))
  // A run of consecutive days (in Saturday-first order) reads as a range.
  const idx = ordered.map((d) => WEEKDAYS.indexOf(d))
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  return consecutive && ordered.length > 2
    ? `${ordered[0].short}–${ordered.at(-1).short}`
    : ordered.map((d) => d.short).join(', ')
}

// ---- Passenger stop choice ------------------------------------------------
// Passengers choose (in the passenger app, only from the admin's stops) their
// pickup, their drop-off, or both — set per route by `passengerChooses`.
// Whatever passengers don't choose, the admin assigns.
export const PASSENGER_CHOICES = [
  { value: 'pickup', label: 'Pickup', hint: 'Passengers choose where they\'re picked up. You assign each one\'s drop-off stop.' },
  { value: 'dropoff', label: 'Drop-off', hint: 'Passengers choose where they get off. You assign each one\'s pickup stop.' },
  { value: 'both', label: 'Both', hint: 'Passengers choose both their pickup and drop-off stops.' },
]
export const passengerChoice = (route) => route?.passengerChooses ?? 'both'
export const choosesPickupFor = (choice) => choice === 'pickup' || choice === 'both'
export const choosesDropOffFor = (choice) => choice === 'dropoff' || choice === 'both'

export function passengerChoiceLabel(route) {
  return PASSENGER_CHOICES.find((c) => c.value === passengerChoice(route)).label
}

export function vehicleLabel(vehicle) {
  return vehicle ? `${vehicle.plate} · ${vehicle.model}` : ''
}

// Resolves a route plan's ids against the current vehicles/users lists.
// A reference to a record that was deleted comes back as `missing: true`.
export function resolveRoute(route, vehicles, users) {
  const find = (list, id) => (id ? list.find((x) => x.id === id) ?? { missing: true } : null)
  const stops = route.stops
  return {
    vehicle: find(vehicles, route.vehicleId),
    driver: find(users, route.driverId),
    supervisor: find(users, route.supervisorId),
    destination: stops.at(-1)?.name ?? '',
    start: stops[0]?.time ?? '',
    arrival: stops.at(-1)?.time ?? '',
  }
}
