import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import Dropdown from '../components/Dropdown.jsx'
import RouteReview from '../components/RouteReview.jsx'
import { SelectField } from '../components/FormFields.jsx'
import { PencilIcon, TrashIcon } from '../components/Icons.jsx'
import { qrStore, routesStore, usersStore, vehiclesStore, useCollection } from '../data/store.js'
import { PASSENGER_CHOICES, daysLabel, formatTime, passengerChoice, passengerChoiceLabel, resolveRoute, routeDays, vehicleLabel } from '../utils/routePlans.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../route-management.css'

const NO_FILTERS = { choice: '', driverId: '', vehicleId: '', supervisorId: '' }

// A referenced record that has since been deleted shows as "Removed".
function Ref({ record, children }) {
  if (!record) return <span className="us-none">—</span>
  if (record.missing) return <span className="fl-missing">Removed</span>
  return children
}

export default function RouteManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [routes, setRoutes] = useCollection(routesStore)
  const [vehicles] = useCollection(vehiclesStore)
  const [users] = useCollection(usersStore)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  // modal: { kind: 'review', id } | { kind: 'delete', route } | null
  const [modal, setModal] = useState(null)
  const [saved, setSaved] = useState(location.state?.saved ?? null)

  const rows = routes.map((r) => ({ route: r, ...resolveRoute(r, vehicles, users) }))
  const drivers = users.filter((u) => u.type === 'driver')
  const supervisors = users.filter((u) => u.type === 'supervisor')

  const query = search.trim().toLowerCase()
  const visible = rows.filter((row) =>
    (!filters.choice || passengerChoice(row.route) === filters.choice) &&
    (!filters.driverId || row.route.driverId === filters.driverId) &&
    (!filters.vehicleId || row.route.vehicleId === filters.vehicleId) &&
    (!filters.supervisorId || row.route.supervisorId === filters.supervisorId) &&
    (!query || [row.route.name, row.destination, row.driver?.name, row.vehicle?.plate, row.supervisor?.name]
      .some((f) => f?.toLowerCase().includes(query))),
  )
  const activeFilters = Object.values(filters).filter(Boolean).length

  function deleteRoute() {
    // TODO: delete on backend once a routes endpoint exists.
    setRoutes((all) => all.filter((r) => r.id !== modal.route.id))
    qrStore.set((all) => all.filter((c) => c.routeId !== modal.route.id))
    setModal(null)
  }

  const editRoute = (id) => navigate(`/route-management/${id}`)
  const openReview = (id) => setModal({ kind: 'review', id })
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">Route Management</h1>

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
                label="Passengers choose"
                options={[{ value: '', label: 'Any' }, ...PASSENGER_CHOICES.map(({ value, label }) => ({ value, label }))]}
                value={filters.choice}
                onChange={setFilter('choice')}
              />
              <SelectField
                label="Driver"
                options={[{ value: '', label: 'All drivers' }, ...drivers.map((u) => ({ value: u.id, label: u.name }))]}
                value={filters.driverId}
                onChange={setFilter('driverId')}
              />
              <SelectField
                label="Vehicle"
                options={[{ value: '', label: 'All vehicles' }, ...vehicles.map((v) => ({ value: v.id, label: vehicleLabel(v) }))]}
                value={filters.vehicleId}
                onChange={setFilter('vehicleId')}
              />
              <SelectField
                label="Supervisor"
                options={[{ value: '', label: 'All supervisors' }, ...supervisors.map((u) => ({ value: u.id, label: u.name }))]}
                value={filters.supervisorId}
                onChange={setFilter('supervisorId')}
              />
              <button type="button" className="fl-clear" disabled={!activeFilters} onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </button>
            </Dropdown>
            {saved && (
              <span className="rs-notice rm-saved">
                Changes to "{saved}" saved.
                <button type="button" aria-label="Dismiss" onClick={() => setSaved(null)}>×</button>
              </span>
            )}
            <button type="button" className="rs-btn fl-add" onClick={() => navigate('/route-setup')}>Add</button>
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table fl-table rm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Supervisor</th>
                  <th>Destination</th>
                  <th>Days</th>
                  <th>Passengers Choose</th>
                  <th>Stops</th>
                  <th>Passengers</th>
                  <th>Start</th>
                  <th>Arrival</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={12}>
                      {routes.length === 0 ? 'No routes yet. Use Add to set one up.' : 'No routes match your search or filters.'}
                    </td>
                  </tr>
                ) : (
                  visible.map(({ route, vehicle, driver, supervisor, destination, start, arrival }) => (
                    <tr
                      key={route.id}
                      className="fl-row"
                      tabIndex={0}
                      title="Review route on the map"
                      onClick={() => openReview(route.id)}
                      onKeyDown={(e) => {
                        // Only when the row itself is focused, not its edit/delete buttons.
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          openReview(route.id)
                        }
                      }}
                    >
                      <td>{route.name}</td>
                      <td className="fl-plate" dir="auto"><Ref record={vehicle}>{vehicle?.plate}</Ref></td>
                      <td><Ref record={driver}>{driver?.name}</Ref></td>
                      <td><Ref record={supervisor}>{supervisor?.name}</Ref></td>
                      <td className="trunc" title={destination}>{destination}</td>
                      <td className="rm-type">{daysLabel(routeDays(route))}</td>
                      <td className="rm-type">{passengerChoiceLabel(route)}</td>
                      <td>{route.stops.length}</td>
                      <td className={vehicle && !vehicle.missing && (route.passengers?.length ?? 0) > vehicle.capacity ? 'fl-missing' : ''}>
                        {route.passengers?.length ?? 0}{vehicle && !vehicle.missing ? ` / ${vehicle.capacity}` : ''}
                      </td>
                      <td className="rm-time">{formatTime(start)}</td>
                      <td className="rm-time">{formatTime(arrival)}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => editRoute(route.id)} aria-label={`Edit ${route.name}`}><PencilIcon /></button>
                        <button type="button" onClick={() => setModal({ kind: 'delete', route })} aria-label={`Delete ${route.name}`}><TrashIcon /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modal?.kind === 'review' && (() => {
        const route = routes.find((r) => r.id === modal.id)
        if (!route) return null
        return (
          <Modal
            title={`Review: ${route.name}`}
            wide
            submitLabel="Edit"
            cancelLabel="Close"
            onClose={() => setModal(null)}
            onSubmit={() => editRoute(route.id)}
          >
            <RouteReview stops={route.stops} passengers={route.passengers} />
          </Modal>
        )
      })()}

      {modal?.kind === 'delete' && (
        <Modal title="Delete Route" submitLabel="Delete" onClose={() => setModal(null)} onSubmit={deleteRoute}>
          <p className="fl-confirm">
            Delete the route <strong>{modal.route.name}</strong> and its {modal.route.stops.length} stops? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
