import { useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import Dropdown from '../components/Dropdown.jsx'
import TripPanel from '../components/TripPanel.jsx'
import { StatusPill } from '../components/ReportPanel.jsx'
import { SelectField } from '../components/FormFields.jsx'
import { routesStore, tripsStore, usersStore, vehiclesStore, useCollection } from '../data/store.js'
import { SEVERITIES, buildTripReport, formatTripDate, sortTripReports } from '../utils/reports.js'
import { formatTime, fromMinutes } from '../utils/routePlans.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../route-management.css'
import '../reports.css'

const NO_FILTERS = { severity: '', routeId: '' }

// Reports on completed trips: problem trips first, then newest first.
// Problems with the routes themselves (schedule, QR, staff…) are on Home.
export default function Reports() {
  const [routes] = useCollection(routesStore)
  const [vehicles] = useCollection(vehiclesStore)
  const [users] = useCollection(usersStore)
  const [trips] = useCollection(tripsStore)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [openId, setOpenId] = useState(null)

  const reports = useMemo(
    () => sortTripReports(trips.map((trip) => buildTripReport(trip, { routes, users, vehicles }))),
    [trips, routes, users, vehicles],
  )

  const counts = Object.fromEntries(SEVERITIES.map((s) => [s.value, reports.filter((r) => r.worst === s.value).length]))
  const okCount = reports.filter((r) => !r.worst).length
  const routeOptions = [...new Map(reports.map((r) => [r.trip.routeId, r.routeName])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const query = search.trim().toLowerCase()
  const visible = reports.filter((r) =>
    (!filters.severity || (filters.severity === 'ok' ? !r.worst : r.worst === filters.severity)) &&
    (!filters.routeId || r.trip.routeId === filters.routeId) &&
    (!query || [r.routeName, r.driver?.name, r.vehicle?.plate, formatTripDate(r.trip.date), ...r.issues.map((i) => i.message)]
      .some((f) => f?.toLowerCase().includes(query))),
  )
  const activeFilters = Object.values(filters).filter(Boolean).length
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))
  const open = reports.find((r) => r.trip.id === openId)

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">Reports</h1>
          <p className="rs-summary rr-intro">Completed trips. Trips with problems are listed first.</p>

          <div className="rr-summary" role="group" aria-label="Filter by status">
            {[...SEVERITIES.map((s) => ({ ...s, count: counts[s.value] })), { value: 'ok', label: 'OK', count: okCount }].map((s) => (
              <button
                key={s.value}
                type="button"
                className={`rr-chip ${s.value}${filters.severity === s.value ? ' on' : ''}`}
                aria-pressed={filters.severity === s.value}
                onClick={() => setFilters((f) => ({ ...f, severity: f.severity === s.value ? '' : s.value }))}
              >
                <strong>{s.count}</strong> {s.label}
              </button>
            ))}
          </div>

          <div className="fl-toolbar">
            <input
              className="rs-input fl-search"
              type="search"
              placeholder="Search...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search trips"
            />
            <Dropdown label="Filters" count={activeFilters}>
              <SelectField
                label="Status"
                options={[{ value: '', label: 'Any status' }, ...SEVERITIES.map(({ value, label }) => ({ value, label })), { value: 'ok', label: 'OK' }]}
                value={filters.severity}
                onChange={setFilter('severity')}
              />
              <SelectField
                label="Route"
                options={[{ value: '', label: 'All routes' }, ...routeOptions]}
                value={filters.routeId}
                onChange={setFilter('routeId')}
              />
              <button type="button" className="fl-clear" disabled={!activeFilters} onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </button>
            </Dropdown>
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table fl-table rr-table-main rr-trips">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Problems</th>
                  <th>Arrival</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={6}>{trips.length === 0 ? 'No completed trips yet.' : 'No trips match your search or filters.'}</td>
                  </tr>
                ) : (
                  visible.map((r) => {
                    const top = r.issues[0]
                    const arr = r.arrival
                    return (
                      <tr
                        key={r.trip.id}
                        className={`fl-row rr-row ${r.worst ?? 'ok'}`}
                        tabIndex={0}
                        title="Open trip report"
                        onClick={() => setOpenId(r.trip.id)}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            setOpenId(r.trip.id)
                          }
                        }}
                      >
                        <td><StatusPill worst={r.worst} /></td>
                        <td className="rm-time">{formatTripDate(r.trip.date)}</td>
                        <td>{r.routeName}</td>
                        <td>{r.driver?.name ?? '—'}</td>
                        <td className="rr-top">
                          {top ? (
                            <>
                              <span>{top.message}</span>
                              {r.issues.length > 1 && <small> +{r.issues.length - 1} more</small>}
                            </>
                          ) : <span className="us-none">No problems</span>}
                        </td>
                        <td className="rm-time">
                          {arr && formatTime(arr.stop.time)}
                          {arr?.actual != null && (
                            <small className={arr.diff >= 5 ? 'late' : ''}>
                              {' → '}{formatTime(fromMinutes(arr.actual))}
                            </small>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {open && (
        <Modal title={`Trip: ${open.routeName} · ${formatTripDate(open.trip.date)}`} wide cancelLabel="Close" onClose={() => setOpenId(null)}>
          <TripPanel report={open} users={users} />
        </Modal>
      )}
    </div>
  )
}
