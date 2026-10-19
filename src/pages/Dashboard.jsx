import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import MapView from '../components/MapView.jsx'
import RouteList, { needsFix } from '../components/RouteList.jsx'
import Modal from '../components/Modal.jsx'
import ReportPanel from '../components/ReportPanel.jsx'
import useRouteHealth from '../utils/useRouteHealth.js'
import { getRoadPath } from '../utils/osrm.js'
import { sortForHome } from '../utils/reports.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../route-management.css'
import '../reports.css'

// Home: every created route with its state — active (a trip is running) or
// not, and whether it needs fixing — in priority order, on the map.
export default function Dashboard() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const { reports, checkLive, checking, liveCheckedAt } = useRouteHealth()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [reportId, setReportId] = useState(null)

  const query = search.trim().toLowerCase()
  const visible = sortForHome(reports).filter((r) =>
    (filter === 'all' || (filter === 'active' ? r.route.active : needsFix(r))) &&
    (!query || [r.route.name, r.driver?.name, r.vehicle?.plate].some((f) => f?.toLowerCase().includes(query))),
  )

  // Map markers: where each route starts. Memoised so live-traffic refreshes
  // don't rebuild the markers.
  const markerKey = reports.map((r) => `${r.route.id}:${r.route.name}:${JSON.stringify(r.route.stops[0]?.location)}`).join('|')
  const markers = useMemo(
    () => reports
      .filter((r) => r.route.stops.length)
      .map((r) => ({ name: r.route.name, lat: r.route.stops[0].location.lat, lng: r.route.stops[0].location.lng })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markerKey],
  )

  const selected = reports.find((r) => r.route.id === selectedId)
  const selectedStopsKey = selected ? JSON.stringify(selected.route.stops.map((s) => s.location)) : ''

  // Draw the selected route: numbered stops, then the road path (straight
  // lines if the road path can't be fetched).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!selected) return map.clearRoute()
    const stops = selected.route.stops
    map.clearRoute()
    map.showStops(stops)
    let cancelled = false
    const points = stops.map((s) => s.location)
    getRoadPath(points)
      .then((r) => r.coordinates)
      .catch(() => points.map((p) => [p.lng, p.lat]))
      .then((coords) => { if (!cancelled && coords.length > 1) map.showRoutePath(coords) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedStopsKey])

  function handleAction(action, routeId) {
    setReportId(null)
    navigate(action.kind === 'edit' ? `/route-management/${routeId}` : action.to)
  }

  const open = reports.find((r) => r.route.id === reportId)

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="map-col">
        <MapView ref={mapRef} routes={markers} />
      </div>

      <RouteList
        reports={visible}
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={(r) => setSelectedId((id) => (id === r.route.id ? null : r.route.id))}
        onAction={handleAction}
        onOpenReport={setReportId}
      />

      {open && (
        <Modal
          title={`Report: ${open.route.name}`}
          wide
          submitLabel="Edit route"
          cancelLabel="Close"
          onClose={() => setReportId(null)}
          onSubmit={() => handleAction({ kind: 'edit' }, open.route.id)}
        >
          <ReportPanel
            report={open}
            liveCheckedAt={liveCheckedAt[open.route.id] ?? null}
            checkingLive={checking.has(open.route.id)}
            onCheckLive={() => checkLive([open.route])}
            onAction={(action) => handleAction(action, open.route.id)}
          />
        </Modal>
      )}
    </div>
  )
}
