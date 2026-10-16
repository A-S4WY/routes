import { TOMTOM_API_KEY } from '../config.js'

// Calls TomTom's Routing API with live traffic and returns both a
// human-readable duration and the route's path geometry (as an array
// of [lng, lat] pairs, ready to hand to MapLibre as a GeoJSON LineString).
// Docs: https://developer.tomtom.com/routing-api/documentation
export async function getRoute(origin, destination) {
  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/` +
    `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json` +
    `?key=${TOMTOM_API_KEY}&traffic=true`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Routing API returned ${res.status}`)
  }
  const data = await res.json()
  const route = data?.routes?.[0]
  if (!route) return null

  const seconds = route.summary?.travelTimeInSeconds
  const durationText = formatDuration(seconds)

  // Flatten every leg's points into one continuous line, converting
  // TomTom's {latitude, longitude} points into [lng, lat] pairs.
  const coordinates = (route.legs || []).flatMap((leg) =>
    (leg.points || []).map((p) => [p.longitude, p.latitude])
  )

  return { durationText, coordinates }
}

function formatDuration(seconds) {
  if (!seconds) return null
  const minutes = Math.round(seconds / 60)
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
    : `${minutes} min`
}
