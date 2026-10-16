import { TOMTOM_API_KEY } from '../config.js'

// Live-traffic results are reused for this long before asking TomTom again.
const TRAFFIC_CACHE_MS = 60 * 1000

// key -> { promise, expires }. Storing the promise (not just the result) means
// identical requests made at the same moment share a single API call.
const trafficCache = new Map()

function cacheKey(points) {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(':')
}

// Asks TomTom's Routing API for the live-traffic travel time through the
// given points, in order. Only the summary is requested — the route line is
// drawn separately (see osrm.js). Results are cached for a minute per set of
// points. Returns { seconds, meters }.
// Docs: https://developer.tomtom.com/routing-api/documentation
export function getTravelTime(points) {
  const key = cacheKey(points)
  const cached = trafficCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.promise

  const entry = { expires: Infinity }
  entry.promise = fetchTravelTime(key)
    .then((result) => {
      entry.expires = Date.now() + TRAFFIC_CACHE_MS
      return result
    })
    .catch((err) => {
      trafficCache.delete(key) // don't cache failures
      throw err
    })
  trafficCache.set(key, entry)
  return entry.promise
}

async function fetchTravelTime(locations) {
  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json` +
    `?key=${TOMTOM_API_KEY}&traffic=true&routeRepresentation=summaryOnly`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Routing API returned ${res.status}`)
  }
  const data = await res.json()
  const summary = data?.routes?.[0]?.summary
  if (!summary) throw new Error('No route found')

  return { seconds: summary.travelTimeInSeconds, meters: summary.lengthInMeters }
}
