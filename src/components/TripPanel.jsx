import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import { Diff, StatusPill } from './ReportPanel.jsx'
import { formatTime, vehicleLabel } from '../utils/routePlans.js'
import { SEVERITIES, formatTripDate } from '../utils/reports.js'

const ICONS = { critical: AlertOctagon, warning: AlertTriangle, info: Info }
const SEVERITY_LABEL = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label]))
const PASSENGER_STATE = {
  dropped: { label: 'Dropped off', cls: 'ok' },
  unconfirmed: { label: 'Drop-off not confirmed', cls: 'bad' },
  'not-boarded': { label: "Didn't board", cls: 'muted' },
}

// Overlay content for one completed trip (buildTripReport() output).
export default function TripPanel({ report, users }) {
  const { trip, issues, rows } = report

  return (
    <div className="rr-panel">
      <div className="fl-info">
        <dl>
          <dt>Date</dt>
          <dd>{formatTripDate(trip.date)}</dd>
          <dt>Route</dt>
          <dd>{report.routeName}</dd>
          <dt>Driver</dt>
          <dd>{report.driver?.name ?? '—'}</dd>
          <dt>Vehicle</dt>
          <dd dir="auto">{report.vehicle ? vehicleLabel(report.vehicle) : '—'}</dd>
        </dl>
      </div>

      <section>
        <div className="rr-panel-head">
          <h4>Problems</h4>
          <StatusPill worst={report.worst} />
        </div>
        {issues.length === 0 ? (
          <p className="rs-none">This trip ran on schedule with every drop-off confirmed.</p>
        ) : (
          <ul className="rr-issues">
            {issues.map((issue, i) => {
              const Icon = ICONS[issue.severity]
              return (
                <li key={i} className={issue.severity}>
                  <Icon size={16} aria-label={SEVERITY_LABEL[issue.severity]} />
                  <span>{issue.message}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="rr-panel-head"><h4>Stops</h4></div>
        <div className="rs-table-wrap">
          <table className="rs-table rr-schedule">
            <thead>
              <tr><th>#</th><th>Stop</th><th>Scheduled</th><th>Arrived</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.stop.id}>
                  <td className="num">{i + 1}</td>
                  <td>{r.stop.name}</td>
                  <td className="rm-time">{formatTime(r.stop.time)}</td>
                  <td>{r.actual === null ? <span className="fl-missing">Not recorded</span> : <Diff row={{ expected: r.actual, diff: r.diff }} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="rr-panel-head"><h4>Passengers</h4></div>
        {!trip.passengers?.length ? (
          <p className="rs-none">No passengers were assigned to this trip.</p>
        ) : (
          <div className="rs-table-wrap">
            <table className="rs-table rr-schedule">
              <thead>
                <tr><th>Name</th><th>Boarded</th><th>Dropped off</th><th>Status</th></tr>
              </thead>
              <tbody>
                {trip.passengers.map((p) => {
                  const state = PASSENGER_STATE[p.state] ?? { label: p.state, cls: 'muted' }
                  return (
                    <tr key={p.userId}>
                      <td>{users.find((u) => u.id === p.userId)?.name ?? <span className="fl-missing">Removed user</span>}</td>
                      <td className="rm-time">{p.boardedAt ? formatTime(p.boardedAt) : '—'}</td>
                      <td className="rm-time">{p.droppedAt ? formatTime(p.droppedAt) : '—'}</td>
                      <td><span className={`rr-pstate ${state.cls}`}>{state.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
