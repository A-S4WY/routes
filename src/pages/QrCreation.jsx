import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import Dropdown from '../components/Dropdown.jsx'
import QrPanel from '../components/QrPanel.jsx'
import { SelectField } from '../components/FormFields.jsx'
import { qrStore, routesStore, usersStore, vehiclesStore, useCollection } from '../data/store.js'
import { formatTime, resolveRoute } from '../utils/routePlans.js'
import { QR_STATES, createQr, formatDateTime, qrStatus } from '../utils/qr.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../route-management.css'
import '../qr.css'

const NO_FILTERS = { state: '', driverId: '' }

// Re-render periodically so codes flip to "Expired" without a reload.
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function Ref({ record, children }) {
  if (!record) return <span className="us-none">—</span>
  if (record.missing) return <span className="fl-missing">Removed</span>
  return children
}

export default function QrCreation() {
  const [routes] = useCollection(routesStore)
  const [vehicles] = useCollection(vehiclesStore)
  const [users] = useCollection(usersStore)
  const [codes, setCodes] = useCollection(qrStore)
  const now = useNow()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [openId, setOpenId] = useState(null)

  const rows = routes.map((route) => {
    const qr = codes.find((c) => c.routeId === route.id) ?? null
    return { route, qr, status: qrStatus(qr, route, now), ...resolveRoute(route, vehicles, users) }
  })
  const drivers = users.filter((u) => u.type === 'driver')

  const query = search.trim().toLowerCase()
  const matchesState = (state) =>
    !filters.state || (filters.state === 'attention' ? state !== 'active' : state === filters.state)
  const visible = rows.filter((row) =>
    matchesState(row.status.state) &&
    (!filters.driverId || row.route.driverId === filters.driverId) &&
    (!query || [row.route.name, row.destination, row.driver?.name, row.vehicle?.plate]
      .some((f) => f?.toLowerCase().includes(query))),
  )
  const activeFilters = Object.values(filters).filter(Boolean).length
  const needsAttention = rows.filter((r) => r.status.state !== 'active').length

  function generate(route, validity) {
    // TODO: have the backend issue (and later verify) the token.
    const qr = createQr(route, validity)
    setCodes((all) => [...all.filter((c) => c.routeId !== route.id), qr])
  }

  function revoke(routeId) {
    // TODO: revoke on backend once a QR endpoint exists.
    setCodes((all) => all.map((c) => (c.routeId === routeId ? { ...c, revokedAt: Date.now() } : c)))
  }

  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))
  const open = rows.find((r) => r.route.id === openId)

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">QR Creation</h1>

          <div className="fl-toolbar">
            <input
              className="rs-input fl-search"
              type="search"
              placeholder="Search...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search routes"
            />
            <Dropdown label="Filters" count={activeFilters}>
              <SelectField
                label="QR status"
                options={[{ value: '', label: 'Any status' }, { value: 'attention', label: 'Needs attention' }, ...QR_STATES]}
                value={filters.state}
                onChange={setFilter('state')}
              />
              <SelectField
                label="Driver"
                options={[{ value: '', label: 'All drivers' }, ...drivers.map((u) => ({ value: u.id, label: u.name }))]}
                value={filters.driverId}
                onChange={setFilter('driverId')}
              />
              <button type="button" className="fl-clear" disabled={!activeFilters} onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </button>
            </Dropdown>
            {needsAttention > 0 && filters.state !== 'attention' && (
              <button
                type="button"
                className="qr-attention"
                onClick={() => setFilters((f) => ({ ...f, state: 'attention' }))}
                title="Show routes whose QR code is missing, expired, revoked or out of date"
              >
                {needsAttention} route{needsAttention === 1 ? '' : 's'} need{needsAttention === 1 ? 's' : ''} a new QR
              </button>
            )}
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table fl-table qr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Destination</th>
                  <th>Start</th>
                  <th>QR Status</th>
                  <th>Expires</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={8}>
                      {routes.length === 0 ? 'No routes yet. Create one in Route Setup first.' : 'No routes match your search or filters.'}
                    </td>
                  </tr>
                ) : (
                  visible.map(({ route, qr, status, vehicle, driver, destination, start }) => (
                    <tr
                      key={route.id}
                      className="fl-row"
                      tabIndex={0}
                      title="Open QR code"
                      onClick={() => setOpenId(route.id)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          setOpenId(route.id)
                        }
                      }}
                    >
                      <td>{route.name}</td>
                      <td className="fl-plate" dir="auto"><Ref record={vehicle}>{vehicle?.plate}</Ref></td>
                      <td><Ref record={driver}>{driver?.name}</Ref></td>
                      <td className="trunc" title={destination}>{destination}</td>
                      <td className="rm-time">{formatTime(start)}</td>
                      <td><span className={`qr-pill ${status.state}`}>{status.label}</span></td>
                      <td className="rm-time">{qr?.expiresAt ? formatDateTime(qr.expiresAt) : qr ? 'Never' : '—'}</td>
                      <td className="actions">
                        <button type="button" aria-label={`Open QR for ${route.name}`} tabIndex={-1}><QrCode /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {open && (
        <Modal title={`QR Code: ${open.route.name}`} wide cancelLabel="Close" onClose={() => setOpenId(null)}>
          <QrPanel
            key={`${open.route.id}-${open.qr?.token ?? 'none'}`}
            route={open.route}
            info={open}
            qr={open.qr}
            status={open.status}
            onGenerate={(validity) => generate(open.route, validity)}
            onRevoke={() => revoke(open.route.id)}
          />
        </Modal>
      )}
    </div>
  )
}
