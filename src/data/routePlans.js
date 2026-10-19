// Static placeholder route plans (created in Route Setup, managed in Route
// Management). Swap for a real API call later, e.g. fetch('/api/route-plans').
// Not to be confused with routes.js, which feeds the Home map.
//
// vehicleId / driverId / supervisorId point at records in vehicles.js and
// users.js. Stops are kept in time order; the last stop is the destination.
// passengerChooses: 'pickup' | 'dropoff' | 'both' — which of their stops
// passengers pick themselves (only from these stops); the admin assigns the rest.
// stop.role: 'pickup' | 'dropoff' | 'both'; stop.waitMinutes: driver wait there.
// days: weekdays it runs on (getDay() numbers, 0 = Sunday).
// active: true while a trip of this route is running (set by the backend /
// driver app later; active routes get live-traffic times).
// passengers: [{ userId, pickupStopId, dropOffStopId }] — null where the
// passenger hasn't chosen yet. Drop-off stops drive automatic
// drop-off detection (utils/dropOff.js).
// Coordinates are approximate, for demo purposes only.
const MAADI_STOPS = [
  { name: 'Nasr St.', time: '06:00', waitMinutes: 3, role: 'pickup', location: { lat: 29.96012, lng: 31.25764 } },
  { name: 'Laselky St.', time: '06:10', waitMinutes: 2, role: 'pickup', location: { lat: 29.96741, lng: 31.27536 } },
  { name: 'Nerco', time: '06:20', waitMinutes: 2, role: 'both', location: { lat: 29.97452, lng: 31.28915 } },
  { name: 'Egypt University of Informatics', time: '07:10', waitMinutes: 0, role: 'dropoff', location: { lat: 30.0136, lng: 31.7056 } },
]

// times: optional per-route schedule overriding the default stop times.
function stopsFor(routeId, times = []) {
  return MAADI_STOPS.map((s, i) => ({ ...s, time: times[i] ?? s.time, id: `${routeId}-s${i + 1}` }))
}

export const ROUTE_PLANS = [
  {
    id: 'r1', name: 'Maadi', vehicleId: 'v1', driverId: 'u5', supervisorId: 'u4', active: true, days: [0, 1, 2, 3, 4],
    passengerChooses: 'both', stops: stopsFor('r1'),
    passengers: [
      { userId: 'u1', pickupStopId: 'r1-s1', dropOffStopId: 'r1-s4' },
      { userId: 'u6', pickupStopId: 'r1-s2', dropOffStopId: 'r1-s3' },
    ],
  },
  {
    id: 'r2', name: 'Maadi 1', vehicleId: 'v2', driverId: 'u3', supervisorId: null, active: false, days: [0, 1, 2, 3, 4],
    passengerChooses: 'pickup',
    // A tight timetable (the Reports page flags it as running late).
    stops: stopsFor('r2', ['06:00', '06:05', '06:12', '06:55']),
    passengers: [
      // Ali chose Laselky St. in the app; Omar hasn't chosen yet.
      { userId: 'u1', pickupStopId: 'r2-s2', dropOffStopId: 'r2-s4' },
      { userId: 'u6', pickupStopId: null, dropOffStopId: 'r2-s4' },
    ],
  },
  {
    id: 'r3', name: 'Maadi 2', vehicleId: 'v3', driverId: 'u5', supervisorId: 'u4', active: false, days: [6, 1, 3],
    passengerChooses: 'dropoff', stops: stopsFor('r3'), passengers: [],
  },
]
