// Road-following route geometry from OSRM (open-source, no API key).
// The public demo server is fine for development but rate-limited
// (~1 request/second) — point OSRM_URL at your own instance for production.
// Docs: https://project-osrm.org/docs/v5.24.0/api/#route-service
const OSRM_URL = 'https://router.project-osrm.org'

// Road geometry doesn't change, so paths are kept for the whole session.
const pathCache = new Map()

// Returns the driving route through the given points, in order:
// { coordinates, seconds, meters } — coordinates are [lng, lat] pairs ready
// for a MapLibre GeoJSON LineString; seconds is a typical (no-traffic) estimate.
export function getRoadPath(points) {
  const coords = points.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(';')
  if (pathCache.has(coords)) return pathCache.get(coords)

  const promise = fetch(`${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`)
    .then((res) => {
      if (!res.ok) throw new Error(`OSRM returned ${res.status}`)
      return res.json()
    })
    .then((data) => {
      const route = data?.routes?.[0]
      const coordinates = route?.geometry?.coordinates
      if (data?.code !== 'Ok' || !coordinates?.length) throw new Error(`OSRM: ${data?.code || 'no route'}`)
      return { coordinates, seconds: route.duration, meters: Math.round(route.distance) }
    })
    .catch((err) => {
      pathCache.delete(coords) // allow a retry next time
      throw err
    })

  pathCache.set(coords, promise)
  return promise
}
