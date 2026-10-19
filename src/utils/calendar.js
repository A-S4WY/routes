// Day planning helpers for the Calendar page.
import { runsOn, toMinutes } from './routePlans.js'

// Dates are handled as local 'YYYY-MM-DD' strings.
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
export const fromDateKey = (key) => new Date(`${key}T00:00:00`)
export const addDays = (key, n) => {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}
export const todayKey = () => toDateKey(new Date())

// The Saturday-to-Friday week containing `key`.
export function weekOf(key) {
  const d = fromDateKey(key)
  const sinceSaturday = (d.getDay() + 1) % 7
  return Array.from({ length: 7 }, (_, i) => addDays(key, i - sinceSaturday))
}

// Trips scheduled on a date: [{ route, start, end }] (minutes after midnight),
// ordered by departure.
export function tripsOn(routes, key) {
  const date = fromDateKey(key)
  return routes
    .filter((r) => r.stops.length && runsOn(r, date))
    .map((route) => {
      const times = route.stops.map((s) => toMinutes(s.time))
      return { route, start: Math.min(...times), end: Math.max(...times) }
    })
    .sort((a, b) => a.start - b.start || a.route.name.localeCompare(b.route.name))
}

// 24 hourly buckets: trips on the road during each hour, and which of them
// depart in it. A trip from 6:00 to 7:10 counts in both 6:00 and 7:00.
export function hourBuckets(trips) {
  return Array.from({ length: 24 }, (_, hour) => {
    const from = hour * 60
    const to = from + 60
    const onRoad = trips.filter((t) => t.start < to && t.end >= from)
    return { hour, onRoad, departing: onRoad.filter((t) => t.start >= from && t.start < to) }
  })
}
