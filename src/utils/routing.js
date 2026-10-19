import { getTravelTime } from './tomtom.js'
import { getRoadPath } from './osrm.js'

// Builds everything a route needs for display:
//  - the line on the map always comes from OSRM (falls back to straight lines),
//  - the travel time comes from TomTom live traffic only when `live` is true
//    (i.e. the route is active right now); otherwise OSRM's typical estimate
//    is used, so reviewing routes never spends TomTom requests.
// Each source fails independently, so this never rejects.
// Returns { durationText, distanceText, coordinates, isRoadPath, isLive, legSeconds }.
// legSeconds[i] is the drive from point i to point i+1 (null if unavailable).
export async function getRouteThrough(points, { live = false } = {}) {
  const [path, traffic] = await Promise.allSettled([
    getRoadPath(points),
    live ? getTravelTime(points) : Promise.resolve(null),
  ])

  if (path.status === 'rejected') console.error('Road path lookup failed:', path.reason)
  if (traffic.status === 'rejected') console.error('Live traffic lookup failed:', traffic.reason)

  const road = path.status === 'fulfilled' ? path.value : null
  const liveTime = traffic.status === 'fulfilled' ? traffic.value : null
  const time = liveTime ?? road

  return {
    durationText: formatDuration(time?.seconds),
    distanceText: formatDistance(time?.meters),
    coordinates: road ? road.coordinates : points.map((p) => [p.lng, p.lat]),
    isRoadPath: !!road,
    isLive: !!liveTime,
    legSeconds: time?.legSeconds?.length === points.length - 1 ? time.legSeconds : null,
  }
}

export function getRoute(origin, destination, options) {
  return getRouteThrough([origin, destination], options)
}

function formatDistance(meters) {
  if (meters == null) return null
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function formatDuration(seconds) {
  if (!seconds) return null
  const minutes = Math.round(seconds / 60)
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
    : `${minutes} min`
}
