import { Search } from 'lucide-react'
import { formatTime, fromMinutes } from '../utils/routePlans.js'
import { SEVERITIES } from '../utils/reports.js'

const SEVERITY_LABEL = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label]))
export const HOME_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'fix', label: 'Needs fix' },
]
// "Needs fix" = any critical or warning problem (minor notes don't count).
export const needsFix = (report) => report.worst === 'critical' || report.worst === 'warning'

// Home page route list: every created route with its state (active or not)
// and whether it needs fixing, in priority order (see sortForHome).
export default function RouteList({ reports, search, onSearchChange, filter, onFilterChange, selectedId, onSelect, onAction, onOpenReport }) {
  return (
    <div className="route-col">
      <h2 className="route-title">Routes</h2>

      <div className="route-toolbar">
        <div className="search-box">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search routes"
          />
        </div>
      </div>
      <div className="home-filters" role="group" aria-label="Show">
        {HOME_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={filter === f.value ? 'on' : ''}
            aria-pressed={filter === f.value}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="route-list home-list">
        {reports.length === 0 && <li className="home-empty">No routes match.</li>}
        {reports.map((r) => {
          const selected = r.route.id === selectedId
          const first = r.route.stops[0]
          const last = r.route.stops.at(-1)
          const fix = needsFix(r)
          return (
            <li key={r.route.id} className={`home-item${selected ? ' selected' : ''}${fix ? ` ${r.worst}` : ''}`}>
              <button type="button" className="home-item-main" onClick={() => onSelect(r)} aria-expanded={selected}>
                <div className="home-item-head">
                  <span className="route-item-name">{r.route.name}</span>
                  <span className={`home-state ${r.route.active ? 'active' : 'inactive'}`}>
                    {r.route.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="home-item-meta">
                  <span className={`home-health ${fix ? r.worst : 'ok'}`}>
                    {fix ? SEVERITY_LABEL[r.worst] : 'OK'}
                  </span>
                  {first && last && <span>{formatTime(first.time)} → {formatTime(last.time)}</span>}
                </div>
                {r.arrival && (
                  <div className={`home-eta${r.arrival.diff >= 5 ? ' late' : ''}`}>
                    ETA {formatTime(fromMinutes(r.arrival.expected))}
                    {r.arrival.diff >= 5 ? ` · ${r.arrival.diff} min late` : ''}
                    {r.schedule.live ? ' · live' : ''}
                  </div>
                )}
                {!selected && fix && <div className="home-top-issue">{r.issues[0].message}</div>}
              </button>

              {selected && (
                <div className="home-item-detail">
                  {r.issues.length === 0 ? (
                    <p className="home-ok">Nothing needs fixing.</p>
                  ) : (
                    <ul className="home-issues">
                      {r.issues.map((issue, i) => (
                        <li key={i} className={issue.severity}>
                          <span>{issue.message}</span>
                          {issue.action && (
                            <button type="button" onClick={() => onAction(issue.action, r.route.id)}>{issue.action.label}</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="home-item-actions">
                    <button type="button" onClick={() => onOpenReport(r.route.id)}>Full report</button>
                    <button type="button" onClick={() => onAction({ kind: 'edit' }, r.route.id)}>Edit route</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
