import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, TrashIcon } from './Icons.jsx'
import { canDropOff, canPickUp, formatTime } from '../utils/routePlans.js'

// "Passengers" section of the route form: who rides this route, where each
// one is picked up and where they get off. The drop-off stop is what
// automatic drop-off detection (utils/dropOff.js) checks the bus against.
//
// value: [{ userId, pickupStopId|null, dropOffStopId|null }]
// choosesPickup / choosesDropOff: that side is picked by the passenger in the
// app — shown read-only here; otherwise the admin assigns it.

const SIDES = {
  pickup: { key: 'pickupStopId', label: 'Pickup', allowed: canPickUp },
  dropoff: { key: 'dropOffStopId', label: 'Drop-off', allowed: canDropOff },
}

// The stop an admin-assigned side defaults to: first pickup / last drop-off.
export function defaultStop(stops, side) {
  const allowed = stops.filter(SIDES[side].allowed)
  return (side === 'pickup' ? allowed[0] : allowed.at(-1))?.id ?? ''
}

function StopOptions({ stops, side }) {
  return stops.map((s, i) => (
    <option key={s.id} value={s.id} disabled={!SIDES[side].allowed(s)}>
      {i + 1}. {s.name} ({formatTime(s.time)})
    </option>
  ))
}

function validStop(stops, id, side) {
  const stop = stops.find((s) => s.id === id)
  return !!stop && SIDES[side].allowed(stop)
}

// One pickup / drop-off cell in the passengers table.
function StopCell({ passenger, side, stops, byPassenger, userName, onSet }) {
  const id = passenger[SIDES[side].key]
  const valid = validStop(stops, id, side)

  if (byPassenger) {
    const stop = stops.find((s) => s.id === id)
    return (
      <span className="rp-chosen">
        {!id && <em>Not chosen yet</em>}
        {id && valid && stop.name}
        {id && !valid && <span className="fl-missing">Choice no longer available</span>}
        <span className="rp-tag">by passenger</span>
      </span>
    )
  }
  return (
    <select
      className={`rp-inline${valid ? '' : ' bad'}`}
      value={valid ? id : ''}
      onChange={(e) => onSet(e.target.value)}
      aria-label={`${SIDES[side].label} stop for ${userName}`}
    >
      {!valid && <option value="">Choose a stop…</option>}
      <StopOptions stops={stops} side={side} />
    </select>
  )
}

export default function RoutePassengers({ value, onChange, stops, users, capacity, choosesPickup, choosesDropOff }) {
  const passengers = users.filter((u) => u.type === 'passenger')
  const [pickId, setPickId] = useState('')
  const [pick, setPick] = useState({ pickup: '', dropoff: '' }) // '' = default stop

  const assignedIds = new Set(value.map((p) => p.userId))
  const available = passengers.filter((u) => !assignedIds.has(u.id))
  const full = capacity != null && value.length >= capacity
  const adminSides = ['pickup', 'dropoff'].filter((s) => (s === 'pickup' ? !choosesPickup : !choosesDropOff))
  const missingStops = adminSides.some((s) => !defaultStop(stops, s))
  const canAdd = pickId && !full && !missingStops

  const chosen = (side) => pick[side] || defaultStop(stops, side)

  function add() {
    if (!canAdd) return
    onChange([
      ...value,
      {
        userId: pickId,
        pickupStopId: choosesPickup ? null : chosen('pickup'),
        dropOffStopId: choosesDropOff ? null : chosen('dropoff'),
      },
    ])
    setPickId('')
    setPick({ pickup: '', dropoff: '' })
  }

  const setStop = (userId, key, stopId) =>
    onChange(value.map((p) => (p.userId === userId ? { ...p, [key]: stopId } : p)))
  const remove = (userId) => onChange(value.filter((p) => p.userId !== userId))

  const addTitle = full ? 'The vehicle is full'
    : missingStops ? 'Add pickup and drop-off stops first'
    : canAdd ? 'Add passenger' : 'Choose a passenger first'

  return (
    <section className="rs-points rp">
      <h2 className="rs-label">
        Passengers
        <span className="rp-count">
          {value.length}{capacity != null ? ` / ${capacity} seats` : ''}
        </span>
      </h2>

      {passengers.length === 0 ? (
        <p className="rs-none">No passengers registered yet. <Link to="/users?type=passenger">Register one</Link> first.</p>
      ) : missingStops ? (
        <p className="rp-locked">
          Add your stops above first. Each passenger is assigned{' '}
          {adminSides.length === 2 ? 'a pickup and a drop-off stop' : adminSides[0] === 'pickup' ? 'a pickup stop' : 'a drop-off stop'}
          {' '}from them{stops.length ? `, and this route has no ${adminSides.filter((s) => !defaultStop(stops, s)).map((s) => SIDES[s].label.toLowerCase()).join(' or ')} stop yet` : ''}.
        </p>
      ) : (
        <div className="rs-row rp-add">
          <select className="rs-input rp-select" value={pickId} onChange={(e) => setPickId(e.target.value)} aria-label="Passenger to add">
            <option value="">{available.length ? 'Add a passenger…' : 'All passengers added'}</option>
            {available.map((u) => (
              <option key={u.id} value={u.id} disabled={u.status !== 'subscribed'}>
                {u.name} · {u.otherId}{u.status !== 'subscribed' ? ' (unsubscribed)' : ''}
              </option>
            ))}
          </select>
          {adminSides.map((side) => (
            <select
              key={side}
              className="rs-input rp-select"
              value={chosen(side)}
              onChange={(e) => setPick((p) => ({ ...p, [side]: e.target.value }))}
              disabled={!defaultStop(stops, side)}
              aria-label={`${SIDES[side].label} stop`}
              title={`${SIDES[side].label} stop`}
            >
              {defaultStop(stops, side) ? <StopOptions stops={stops} side={side} /> : <option value="">No {SIDES[side].label.toLowerCase()} stops yet</option>}
            </select>
          ))}
          <button type="button" className="rs-check" onClick={add} disabled={!canAdd} aria-label="Add passenger" title={addTitle}>
            <CheckIcon />
          </button>
        </div>
      )}
      {(choosesPickup || choosesDropOff) && (
        <p className="rs-summary rp-note">
          Passengers choose their {choosesPickup && choosesDropOff ? 'pickup and drop-off' : choosesPickup ? 'pickup' : 'drop-off'} in the app, from the stops above.
        </p>
      )}
      {full && <p className="rs-summary rs-warn">The vehicle is full ({capacity} seats). Choose a bigger vehicle to add more passengers.</p>}

      <div className="rs-table-wrap">
        <table className="rs-table rp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Pickup</th>
              <th>Drop-off</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {value.length === 0 ? (
              <tr className="empty"><td colSpan={5}>No passengers on this route yet.</td></tr>
            ) : (
              value.map((p) => {
                const user = users.find((u) => u.id === p.userId)
                const userName = user?.name ?? 'removed user'
                return (
                  <tr key={p.userId}>
                    <td>{user ? user.name : <span className="fl-missing">Removed user</span>}</td>
                    <td>{user?.otherId ?? '—'}</td>
                    <td>
                      <StopCell passenger={p} side="pickup" stops={stops} byPassenger={choosesPickup} userName={userName}
                        onSet={(id) => setStop(p.userId, 'pickupStopId', id)} />
                    </td>
                    <td>
                      <StopCell passenger={p} side="dropoff" stops={stops} byPassenger={choosesDropOff} userName={userName}
                        onSet={(id) => setStop(p.userId, 'dropOffStopId', id)} />
                    </td>
                    <td className="actions">
                      <button type="button" onClick={() => remove(p.userId)} aria-label={`Remove ${userName}`}><TrashIcon /></button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Problems that block saving the route, as short phrases.
// Sides chosen by passengers never block saving: they may not have chosen yet.
export function passengerProblems(value, stops, users, capacity, { choosesPickup, choosesDropOff }) {
  const problems = []
  if (value.some((p) => !users.some((u) => u.id === p.userId))) problems.push('remove deleted passengers')
  if (!choosesPickup && value.some((p) => !validStop(stops, p.pickupStopId, 'pickup'))) {
    problems.push('choose a pickup stop for every passenger')
  }
  if (!choosesDropOff && value.some((p) => !validStop(stops, p.dropOffStopId, 'dropoff'))) {
    problems.push('choose a drop-off stop for every passenger')
  }
  const index = (id) => stops.findIndex((s) => s.id === id)
  if (value.some((p) => p.pickupStopId && p.dropOffStopId && index(p.pickupStopId) >= 0 && index(p.pickupStopId) >= index(p.dropOffStopId))) {
    problems.push('each pickup must come before that passenger\'s drop-off')
  }
  if (capacity != null && value.length > capacity) problems.push(`the vehicle only has ${capacity} seats`)
  return problems
}
