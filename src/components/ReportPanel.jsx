import { AlertOctagon, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { formatTime, fromMinutes, waitOf } from '../utils/routePlans.js'
import { SEVERITIES } from '../utils/reports.js'

const ICONS = { critical: AlertOctagon, warning: AlertTriangle, info: Info }
const SEVERITY_LABEL = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label]))

export function StatusPill({ worst }) {
  return <span className={`rr-status ${worst ?? 'ok'}`}>{worst ? SEVERITY_LABEL[worst] : 'OK'}</span>
}

// Expected/actual time with its difference from the schedule, coloured.
export function Diff({ row }) {
  if (!row) return <span className="us-none">—</span>
  const d = row.diff
  const cls = d >= 15 ? 'late-critical' : d >= 5 ? 'late' : d <= -20 ? 'early' : 'ok'
  return (
    <span className={`rr-diff ${cls}`}>
      {formatTime(fromMinutes(row.expected))}
      <small>{d > 0 ? ` +${d}` : d < 0 ? ` ${d}` : ' ±0'} min</small>
    </span>
  )
}

// Overlay content for one route's report.
// report: buildRouteReport() output; onAction(action) handles issue buttons.
export default function ReportPanel({ report, liveCheckedAt, checkingLive, onCheckLive, onAction }) {
  const { route, issues, schedule } = report
  const { typical, live } = schedule

  return (
    <div className="rr-panel">
      <section>
        <div className="rr-panel-head">
          <h4>Issues</h4>
          <StatusPill worst={report.worst} />
        </div>
        {issues.length === 0 ? (
          <p className="rs-none">Nothing needs attention on this route.</p>
        ) : (
          <ul className="rr-issues">
            {issues.map((issue, i) => {
              const Icon = ICONS[issue.severity]
              return (
                <li key={i} className={issue.severity}>
                  <Icon size={16} aria-label={SEVERITY_LABEL[issue.severity]} />
                  <span>{issue.message}</span>
                  {issue.action && (
                    <button type="button" className="fl-clear" onClick={() => onAction(issue.action)}>{issue.action.label}</button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="rr-panel-head">
          <h4>Schedule check</h4>
          <button type="button" className="rs-btn-ghost rr-live-btn" onClick={onCheckLive} disabled={checkingLive}>
            <RefreshCw size={14} className={checkingLive ? 'spin' : ''} />
            {checkingLive ? 'Checking…' : live ? 'Re-check live traffic' : 'Check live traffic'}
          </button>
        </div>
        <p className="rs-summary rr-legend">
          Expected arrival if the bus waits at each stop as set and drives at
          {live ? ' typical speed and with live traffic' : ' typical speed'}.
          {liveCheckedAt && ` Live traffic checked at ${new Date(liveCheckedAt).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}.`}
        </p>
        <div className="rs-table-wrap">
          <table className="rs-table rr-schedule">
            <thead>
              <tr>
                <th>#</th>
                <th>Stop</th>
                <th>Wait</th>
                <th>Scheduled</th>
                <th>Typical</th>
                <th>Live traffic</th>
              </tr>
            </thead>
            <tbody>
              {route.stops.map((s, i) => {
                return (
                  <tr key={s.id}>
                    <td className="num">{i + 1}</td>
                    <td>{s.name}</td>
                    <td className="rs-wait-cell">{waitOf(s)} min</td>
                    <td className="rm-time">{formatTime(s.time)}</td>
                    <td>{schedule.pending ? <span className="us-none">…</span> : <Diff row={typical?.[i]} />}</td>
                    <td>{live ? <Diff row={live[i]} /> : <span className="us-none">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

