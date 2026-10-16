import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import MapView from '../components/MapView.jsx'
import RouteList from '../components/RouteList.jsx'
import { ROUTES } from '../data/routes.js'
import { DEPOT } from '../config.js'
import { getRoute } from '../utils/routing.js'
import '../dashboard.css'

export default function Dashboard() {
  const [routeData, setRouteData] = useState({}) // { [index]: { durationText, coordinates } }
  const [search, setSearch] = useState('')
  const mapRef = useRef(null)

  // Calculate travel time + path for each route once, on mount.
  useEffect(() => {
    ROUTES.forEach((route, index) => {
      getRoute(DEPOT, { lat: route.lat, lng: route.lng }, { live: route.active })
        .then((result) => {
          if (result) {
            setRouteData((prev) => ({ ...prev, [index]: result }))
          }
        })
        .catch((err) => {
          console.error(`Routing failed for route ${index}:`, err)
        })
    })
  }, [])

  const routesWithEta = ROUTES.map((route, index) => ({
    ...route,
    eta: routeData[index]?.durationText || null,
    etaLive: routeData[index]?.isLive || false,
    coordinates: routeData[index]?.coordinates || null,
  }))

  const filteredRoutes = routesWithEta.filter((r) =>
    r.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  function handleSelectRoute(route) {
    mapRef.current?.focusRoute(route.lat, route.lng)
    if (route.coordinates) {
      mapRef.current?.showRoutePath(route.coordinates)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="map-col">
        <MapView ref={mapRef} routes={routesWithEta} />
      </div>

      <RouteList
        routes={filteredRoutes}
        search={search}
        onSearchChange={setSearch}
        onSelectRoute={handleSelectRoute}
      />
    </div>
  )
}
