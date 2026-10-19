// Static placeholder records of completed trips — what the backend will store
// after each run of a route once the driver app sends GPS and the drop-off
// detection (utils/dropOff.js) has run. Swap for a real API call later,
// e.g. fetch('/api/trips?days=7').
//
// Each trip keeps what it actually ran with, so later route edits don't
// rewrite history:
//   stops        the route's stops at the time ([{ id, name, time }])
//   driverId / vehicleId
//   stopArrivals { [stopId]: 'HH:MM' } when the bus reached each stop
//   passengers   [{ userId, boardedAt, droppedAt, state }] from inferDropOffs()
//                state: 'dropped' | 'unconfirmed' | 'not-boarded'
//   dropOffAlerts alerts from inferDropOffs()
// Dates are relative to page load so the sample always looks recent.
import { ROUTE_PLANS } from './routePlans.js'
import { toDateKey } from '../utils/calendar.js'

const DAY_MS = 24 * 60 * 60 * 1000
// Local calendar date (not UTC — toISOString() would shift the day near midnight).
const daysAgo = (n) => toDateKey(new Date(Date.now() - n * DAY_MS))
const stopsOf = (routeId) => ROUTE_PLANS.find((r) => r.id === routeId).stops.map(({ id, name, time }) => ({ id, name, time }))

export const TRIPS = [
  {
    id: 't1', routeId: 'r1', date: daysAgo(1), driverId: 'u5', vehicleId: 'v1', stops: stopsOf('r1'),
    stopArrivals: { 'r1-s1': '06:02', 'r1-s2': '06:19', 'r1-s3': '06:33', 'r1-s4': '07:24' },
    passengers: [
      { userId: 'u1', boardedAt: '06:03', droppedAt: '07:26', state: 'dropped' },
      { userId: 'u6', boardedAt: '06:20', droppedAt: null, state: 'unconfirmed' },
    ],
    dropOffAlerts: [
      { type: 'unconfirmed', userId: 'u6', stopId: 'r1-s3', message: 'No drop-off detected at Nerco. Confirm with the driver.' },
    ],
  },
  {
    id: 't2', routeId: 'r2', date: daysAgo(1), driverId: 'u3', vehicleId: 'v2', stops: stopsOf('r2'),
    stopArrivals: { 'r2-s1': '06:00', 'r2-s2': '06:07', 'r2-s3': '06:14', 'r2-s4': '06:58' },
    passengers: [
      { userId: 'u1', boardedAt: '06:07', droppedAt: '06:59', state: 'dropped' },
      { userId: 'u6', boardedAt: null, droppedAt: null, state: 'not-boarded' },
    ],
    dropOffAlerts: [],
  },
  {
    id: 't3', routeId: 'r3', date: daysAgo(1), driverId: 'u5', vehicleId: 'v3', stops: stopsOf('r3'),
    // No arrival at Nerco: the bus drove past without stopping.
    stopArrivals: { 'r3-s1': '06:01', 'r3-s2': '06:11', 'r3-s4': '07:08' },
    passengers: [],
    dropOffAlerts: [],
  },
  {
    id: 't4', routeId: 'r1', date: daysAgo(2), driverId: 'u5', vehicleId: 'v1', stops: stopsOf('r1'),
    stopArrivals: { 'r1-s1': '06:00', 'r1-s2': '06:09', 'r1-s3': '06:21', 'r1-s4': '07:08' },
    passengers: [
      { userId: 'u1', boardedAt: '06:01', droppedAt: '07:10', state: 'dropped' },
      { userId: 'u6', boardedAt: '06:10', droppedAt: '06:23', state: 'dropped' },
    ],
    dropOffAlerts: [],
  },
  {
    id: 't5', routeId: 'r2', date: daysAgo(2), driverId: 'u3', vehicleId: 'v2', stops: stopsOf('r2'),
    stopArrivals: { 'r2-s1': '06:04', 'r2-s2': '06:16', 'r2-s3': '06:27', 'r2-s4': '07:13' },
    passengers: [
      { userId: 'u1', boardedAt: '06:16', droppedAt: '07:14', state: 'dropped' },
    ],
    dropOffAlerts: [],
  },
]
