import { useEffect, useMemo, useState } from 'react'
import { qrStore, routesStore, usersStore, vehiclesStore, useCollection } from '../data/store.js'
import { getRoadPath } from './osrm.js'
import { getTravelTime } from './tomtom.js'
import { qrStatus } from './qr.js'
import { buildRouteReport } from './reports.js'

// Live traffic for active routes is refreshed this often while a page is open
// (TomTom results are also cached for a minute in tomtom.js).
const LIVE_REFRESH_MS = 2 * 60 * 1000

// Travel-time estimates are keyed by the route's stop locations, so editing a
// route's stops triggers a fresh estimate.
const stopsKey = (route) => route.stops.map((s) => `${s.location.lat},${s.location.lng}`).join(';')
const points = (route) => route.stops.map((s) => s.location)

// Health reports (utils/reports.js) for every route, with travel times:
//   typical — OSRM, for every route (free)
//   live    — TomTom, automatically for active routes, and on demand via checkLive()
// Returns { reports, checkLive(routes), checking: Set<routeId>, liveCheckedAt: { [routeId]: ms } }.
export default function useRouteHealth() {
  const [routes] = useCollection(routesStore)
  const [vehicles] = useCollection(vehiclesStore)
  const [users] = useCollection(usersStore)
  const [codes] = useCollection(qrStore)

  const [typical, setTypical] = useState({}) // { [routeId]: { key, legs|null } }
  const [live, setLive] = useState({}) // { [routeId]: { key, legs|null, at } }
  const [checking, setChecking] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    for (const route of routes) {
      const key = stopsKey(route)
      if (route.stops.length < 2 || typical[route.id]?.key === key) continue
      getRoadPath(points(route))
        .then((r) => r.legSeconds)
        .catch((err) => { console.error(`Typical travel times failed for ${route.name}:`, err); return null })
        .then((legs) => { if (!cancelled) setTypical((t) => ({ ...t, [route.id]: { key, legs } })) })
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes])

  async function checkLive(targets) {
    const list = targets.filter((r) => r.stops.length >= 2)
    if (!list.length) return
    setChecking((c) => new Set([...c, ...list.map((r) => r.id)]))
    await Promise.all(list.map(async (route) => {
      const legs = await getTravelTime(points(route))
        .then((r) => r.legSeconds)
        .catch((err) => { console.error(`Live traffic failed for ${route.name}:`, err); return null })
      setLive((l) => ({ ...l, [route.id]: { key: stopsKey(route), legs, at: Date.now() } }))
      setChecking((c) => { const n = new Set(c); n.delete(route.id); return n })
    }))
  }

  // Active routes: live traffic now and every LIVE_REFRESH_MS.
  const activeKey = routes.filter((r) => r.active).map((r) => `${r.id}:${stopsKey(r)}`).join('|')
  useEffect(() => {
    const active = () => routesStore.get().filter((r) => r.active)
    checkLive(active())
    const timer = setInterval(() => checkLive(active()), LIVE_REFRESH_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey])

  const reports = useMemo(() => {
    const now = Date.now()
    return routes.map((route) => {
      const key = stopsKey(route)
      const t = typical[route.id]
      const l = live[route.id]
      return buildRouteReport(route, {
        vehicles, users, allRoutes: routes,
        qrState: qrStatus(codes.find((c) => c.routeId === route.id) ?? null, route, now),
        // undefined = still loading; null = couldn't be estimated
        typicalLegs: t?.key === key ? t.legs : route.stops.length < 2 ? null : undefined,
        liveLegs: l?.key === key ? l.legs : null,
      })
    })
  }, [routes, vehicles, users, codes, typical, live])

  const liveCheckedAt = Object.fromEntries(Object.entries(live).map(([id, l]) => [id, l.at]))
  return { reports, checkLive, checking, liveCheckedAt }
}
