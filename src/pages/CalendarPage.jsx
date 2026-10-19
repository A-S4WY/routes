import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import { routesStore, tripsStore, usersStore, vehiclesStore, useCollection } from '../data/store.js'
import { addDays, fromDateKey, hourBuckets, todayKey, tripsOn, weekOf } from '../utils/calendar.js'
import { formatTime, fromMinutes } from '../utils/routePlans.js'
import { SEVERITIES, buildTripReport } from '../utils/reports.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../calendar.css'

const SEVERITY_LABEL = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label]))
const hourLabel = (h) => formatTime(fromMinutes(h * 60))
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Calendar: pick a day and see every trip scheduled on it, grouped by hour
// (how many trips are on the road at 10:00, 11:00, …).
export default function CalendarPage() {
  const navigate = useNavigate()
  const [routes] = useCollection(routesStore)
  const [trips] = useCollection(tripsStore)
  const [users] = useCollection(usersStore)
  const [vehicles] = useCollection(vehiclesStore)

  const today = todayKey()
  const [day, setDay] = useState(today)
  const [showEmpty, setShowEmpty] = useState(false)

  const scheduled = useMemo(() => tripsOn(routes, day), [routes, day])
  const buckets = useMemo(() => hourBuckets(scheduled), [scheduled])
  const week = weekOf(day)
  const weekCounts = Object.fromEntries(week.map((k) => [k, tripsOn(routes, k).length]))

  // What actually happened on past days (from the completed-trip records).
  const records = useMemo(() => {
    const byRoute = {}
    for (const t of trips.filter((x) => x.date === day)) {
      byRoute[t.routeId] = buildTripReport(t, { routes, users, vehicles })
    }
    return byRoute
  }, [trips, day, routes, users, vehicles])

  const busiest = buckets.reduce((a, b) => (b.onRoad.length > a.onRoad.length ? b : a), buckets[0])
  const firstHour = buckets.findIndex((b) => b.onRoad.length)
  const lastHour = 23 - [...buckets].reverse().findIndex((b) => b.onRoad.length)
  const rows = showEmpty || firstHour === -1 ? buckets : buckets.slice(firstHour, lastHour + 1)
  const when = day === today ? 'today' : day < today ? 'past' : 'future'
  const date = fromDateKey(day)

  function tripState(route) {
    if (when === 'past') {
      const r = records[route.id]
      if (!r) return { label: 'No record', cls: 'none' }
      return r.worst ? { label: SEVERITY_LABEL[r.worst], cls: r.worst } : { label: 'Completed', cls: 'ok' }
    }
    if (when === 'today' && route.active) return { label: 'Running now', cls: 'running' }
    return null
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">Calendar</h1>

          <div className="cal-nav">
            <button type="button" className="cal-arrow" onClick={() => setDay((d) => addDays(d, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
            <input
              type="date"
              className="rs-input cal-date"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              aria-label="Day to show"
            />
            <button type="button" className="cal-arrow" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Next day"><ChevronRight size={18} /></button>
            <button type="button" className="rs-btn-ghost cal-today" onClick={() => setDay(today)} disabled={day === today}>Today</button>
            <h2 className="cal-heading">
              {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="cal-week" role="group" aria-label="Week">
            {week.map((k) => {
              const d = fromDateKey(k)
              return (
                <button
                  key={k}
                  type="button"
                  className={`${k === day ? 'on' : ''}${k === today ? ' today' : ''}`}
                  aria-pressed={k === day}
                  onClick={() => setDay(k)}
                >
                  <span className="cal-wd">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className="cal-dm">{d.getDate()}</span>
                  <span className={`cal-count${weekCounts[k] ? '' : ' zero'}`}>{weekCounts[k] ? plural(weekCounts[k], 'trip') : 'No trips'}</span>
                </button>
              )
            })}
          </div>

          {scheduled.length === 0 ? (
            <p className="rp-locked cal-empty">
              No routes run on {date.toLocaleDateString('en-GB', { weekday: 'long' })}s. Set a route&apos;s active days when creating or editing it.
            </p>
          ) : (
            <>
              <div className="cal-summary">
                <span><strong>{plural(scheduled.length, 'trip')}</strong> scheduled</span>
                <span>Busiest hour: <strong>{hourLabel(busiest.hour)}</strong> ({plural(busiest.onRoad.length, 'trip')} on the road)</span>
                <label className="fl-check cal-toggle">
                  <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
                  Show all 24 hours
                </label>
              </div>

              <ol className="cal-hours">
                {rows.map((b) => (
                  <li key={b.hour} className={b.onRoad.length ? '' : 'empty'}>
                    <div className="cal-hour">
                      <span className="cal-time">{hourLabel(b.hour)}</span>
                      <span className={`cal-badge${b.onRoad.length ? '' : ' zero'}`}>
                        {b.onRoad.length ? plural(b.onRoad.length, 'trip') : 'No trips'}
                      </span>
                    </div>
                    <div className="cal-trips">
                      {b.onRoad.map((t) => {
                        const departs = b.departing.includes(t)
                        const state = tripState(t.route)
                        const driver = users.find((u) => u.id === t.route.driverId)
                        return (
                          <button
                            key={t.route.id}
                            type="button"
                            className={`cal-trip${departs ? ' departs' : ' continues'}`}
                            onClick={() => navigate(when === 'past' && records[t.route.id] ? '/reports' : `/route-management/${t.route.id}`)}
                            title={when === 'past' && records[t.route.id] ? 'Open Reports' : 'Edit route'}
                          >
                            <span className="cal-trip-name">{t.route.name}</span>
                            <span className="cal-trip-time">
                              {formatTime(fromMinutes(t.start))} → {formatTime(fromMinutes(t.end))}
                            </span>
                            <span className="cal-trip-meta">
                              {departs ? 'Departs' : 'On the road'}{driver ? ` · ${driver.name}` : ''}
                            </span>
                            {state && <span className={`cal-state ${state.cls}`}>{state.label}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
