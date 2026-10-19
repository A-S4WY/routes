import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from './Modal.jsx'
import MapPicker, { formatCoords } from './MapPicker.jsx'
import RouteReview from './RouteReview.jsx'
import { SelectField } from './FormFields.jsx'
import RoutePassengers, { defaultStop, passengerProblems } from './RoutePassengers.jsx'
import { PinIcon, PencilIcon, TrashIcon, CheckIcon } from './Icons.jsx'
import { usersStore, vehiclesStore, useCollection } from '../data/store.js'
import {
  PASSENGER_CHOICES, STOP_ROLES,
  DEFAULT_WAIT_MINUTES, EVERY_DAY, MAX_WAIT_MINUTES, WEEKDAYS, WORK_WEEK, daysLabel, routeDays,
  canDropOff, canPickUp, choosesDropOffFor, choosesPickupFor, formatTime, passengerChoice,
  roleLabel, sortByTime, stopRole, vehicleLabel, waitOf,
} from '../utils/routePlans.js'

// location is { lat, lng } once picked on the map, otherwise null.
// wait: minutes the driver waits at the stop (kept as the input string).
const EMPTY_DRAFT = { name: '', time: '', location: null, role: 'both', wait: String(DEFAULT_WAIT_MINUTES) }

// A route needs a start and an end.
const MIN_STOPS = 2

// Shows "Select time" as a placeholder, then switches to a native time picker on focus.
function TimeInput({ value, onChange, className = '', ...rest }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...rest}
      className={`rs-input rs-input-time ${className}`}
      type={focused || value ? 'time' : 'text'}
      placeholder="Select time"
      value={value}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ChoosePoint({ location, onClick }) {
  const label = location ? formatCoords(location) : 'Choose Point'
  return (
    <button
      type="button"
      className={`rs-choose${location ? ' picked' : ''}`}
      onClick={onClick}
      title={label}
    >
      <PinIcon />
      <span>{label}</span>
    </button>
  )
}

function Label({ children, required }) {
  return (
    <h2 className="rs-label">
      {children}
      {required && <span className="rs-req">*</span>}
    </h2>
  )
}

// Shown in a picker when there is nothing registered to choose from.
function NoneRegistered({ what, to }) {
  return (
    <p className="rs-none">
      No {what} registered yet. <Link to={to}>Register one</Link> first.
    </p>
  )
}

// Segmented buttons, e.g. Pickup / Drop-off / Both.
function Segmented({ options, value, onChange, label }) {
  return (
    <div className="rs-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function snapshot(route) {
  const { name, vehicleId, driverId, supervisorId, passengerChooses = 'both', stops, passengers = [] } = route
  const days = [...routeDays(route)].sort()
  return JSON.stringify({ name: name.trim(), vehicleId, driverId, supervisorId, days, passengerChooses, stops, passengers })
}

// The route form used by Route Setup (create) and the route edit page.
// `initial` pre-fills it; `onSubmit` receives
// { name, vehicleId, driverId, supervisorId, days, passengerChooses, stops, passengers }.
// allowPassengers: false hides the Passengers section (Route Setup — passengers
// are added after the route exists, from its edit page).
export default function RouteForm({ title, initial = null, submitLabel, onSubmit, onCancel, notice, onChange, allowPassengers = true }) {
  const [vehicles] = useCollection(vehiclesStore)
  const [users] = useCollection(usersStore)
  const drivers = users.filter((u) => u.type === 'driver')
  const supervisors = users.filter((u) => u.type === 'supervisor')

  const [routeName, setRouteName] = useState(initial?.name ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? null)
  const [driverId, setDriverId] = useState(initial?.driverId ?? null)
  const [supervisorId, setSupervisorId] = useState(initial?.supervisorId ?? null)

  // Which stops passengers choose themselves: 'pickup' | 'dropoff' | 'both'.
  // Weekdays the route runs on (getDay() numbers); new routes default to Sun–Thu.
  const [days, setDays] = useState(() => [...routeDays(initial)])
  const [passengerChooses, setPassengerChooses] = useState(passengerChoice(initial))
  const choosesPickup = choosesPickupFor(passengerChooses)
  const choosesDropOff = choosesDropOffFor(passengerChooses)

  const [stops, setStops] = useState(initial?.stops ?? [])
  const [passengers, setPassengers] = useState(initial?.passengers ?? []) // [{ userId, pickupStopId, dropOffStopId }]
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState(null)

  // Which modal is open: 'assignment' | 'supervisor' | 'stop-point' | 'review' | null
  const [modal, setModal] = useState(null)
  const [modalValues, setModalValues] = useState({})

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null
  const driver = drivers.find((u) => u.id === driverId) ?? null
  const supervisor = supervisors.find((u) => u.id === supervisorId) ?? null

  const initialSnapshot = useMemo(
    () => (initial ? snapshot(initial) : null),
    // Only the record we started editing counts as "unchanged".
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const current = {
    name: routeName, vehicleId, driverId, supervisorId: supervisorId ?? null,
    days: [...days].sort(), passengerChooses, stops, passengers,
  }
  const dirty = initialSnapshot ? snapshot(current) !== initialSnapshot : true

  const waitMinutes = Number(draft.wait)
  const waitValid = draft.wait !== '' && Number.isInteger(waitMinutes) && waitMinutes >= 0 && waitMinutes <= MAX_WAIT_MINUTES
  const draftValid = draft.name.trim() && draft.time && draft.location && waitValid
  const canReview = stops.length >= MIN_STOPS
  const stopProblems = [
    canReview && !stops.some(canPickUp) && 'add at least one pickup stop',
    canReview && !stops.some(canDropOff) && 'add at least one drop-off stop',
  ].filter(Boolean)
  const problems = passengerProblems(passengers, stops, users, vehicle?.capacity ?? null, { choosesPickup, choosesDropOff })
  const valid = routeName.trim() && vehicle && driver && days.length > 0 && canReview && stopProblems.length === 0 && problems.length === 0
  const canSubmit = valid && dirty

  // A previously chosen vehicle/driver/supervisor that has since been deleted.
  const vehicleMissing = vehicleId && !vehicle
  const driverMissing = driverId && !driver
  const supervisorMissing = supervisorId && !supervisor

  function edited() {
    onChange?.()
  }

  // Changing what passengers choose: sides passengers now choose are cleared
  // (so an admin pick never shows up as the passenger's choice); sides that go
  // back to the admin get the default stop if empty.
  function changeChoice(next) {
    const byPassenger = { pickupStopId: choosesPickupFor(next), dropOffStopId: choosesDropOffFor(next) }
    setPassengers((all) => all.map((p) => ({
      ...p,
      pickupStopId: byPassenger.pickupStopId ? null : p.pickupStopId || defaultStop(stops, 'pickup') || null,
      dropOffStopId: byPassenger.dropOffStopId ? null : p.dropOffStopId || defaultStop(stops, 'dropoff') || null,
    })))
    setPassengerChooses(next)
    edited()
  }

  function openModal(kind) {
    const initialValues = {
      assignment: { vehicleId: vehicle ? vehicleId : '', driverId: driver ? driverId : '' },
      supervisor: { supervisorId: supervisor ? supervisorId : '' },
      'stop-point': { location: draft.location },
      review: {},
    }[kind]
    setModalValues(initialValues)
    setModal(kind)
  }

  function submitModal() {
    if (modal === 'assignment') {
      setVehicleId(modalValues.vehicleId)
      setDriverId(modalValues.driverId)
      edited()
    }
    if (modal === 'supervisor') {
      setSupervisorId(modalValues.supervisorId || null)
      edited()
    }
    if (modal === 'stop-point') setDraft((d) => ({ ...d, location: modalValues.location }))
    setModal(null)
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
  }

  function saveStop() {
    if (!draftValid) return
    const { wait, ...rest } = draft
    const stop = { ...rest, name: draft.name.trim(), waitMinutes }
    setStops((all) =>
      sortByTime(
        editingId
          ? all.map((s) => (s.id === editingId ? { ...s, ...stop } : s))
          : [...all, { ...stop, id: crypto.randomUUID() }],
      ),
    )
    resetDraft()
    edited()
  }

  function editStop(s) {
    setDraft({ name: s.name, time: s.time, location: s.location, role: stopRole(s), wait: String(waitOf(s)) })
    setEditingId(s.id)
  }

  function deleteStop(id) {
    setStops((all) => all.filter((s) => s.id !== id))
    if (editingId === id) resetDraft()
    edited()
  }

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({ ...current, name: routeName.trim() })
  }

  return (
    <>
      <div className="rs">
        <h1 className="rs-title">{title}</h1>

        <section className="rs-section">
          <Label required>Route Name</Label>
          <input
            className="rs-input rs-w-lg"
            placeholder="Route name..."
            value={routeName}
            onChange={(e) => { setRouteName(e.target.value); edited() }}
          />
        </section>

        <section className="rs-section rs-row rs-row-assign">
          <div className="rs-col-assign">
            <Label required>Vehicle &amp; Driver Selection</Label>
            <button type="button" className="rs-btn" onClick={() => openModal('assignment')}>
              {vehicle && driver ? 'Change' : 'Select'}
            </button>
            {(vehicle || driver) && (
              <p className="rs-summary">{[vehicleLabel(vehicle), driver?.name].filter(Boolean).join(' — ')}</p>
            )}
            {(vehicleMissing || driverMissing) && (
              <p className="rs-summary rs-warn">
                {vehicleMissing && driverMissing ? 'The vehicle and driver were' : vehicleMissing ? 'The vehicle was' : 'The driver was'} removed. Please choose again.
              </p>
            )}
          </div>
          <div>
            <Label>Add Supervisor</Label>
            <button type="button" className="rs-btn" onClick={() => openModal('supervisor')}>
              {supervisor ? 'Change' : 'Add'}
            </button>
            {supervisor && <p className="rs-summary">{supervisor.name}</p>}
            {supervisorMissing && <p className="rs-summary rs-warn">The supervisor was removed.</p>}
          </div>
        </section>

        <section className="rs-section">
          <Label required>Active Days</Label>
          <div className="rs-days" role="group" aria-label="Days the route runs">
            {WEEKDAYS.map((d) => {
              const on = days.includes(d.value)
              return (
                <button
                  key={d.value}
                  type="button"
                  className={on ? 'on' : ''}
                  aria-pressed={on}
                  title={d.label}
                  onClick={() => { setDays((all) => (on ? all.filter((x) => x !== d.value) : [...all, d.value])); edited() }}
                >
                  {d.short}
                </button>
              )
            })}
          </div>
          <div className="rs-days-presets">
            <button type="button" className="fl-clear" onClick={() => { setDays([...WORK_WEEK]); edited() }}>Sun–Thu</button>
            <button type="button" className="fl-clear" onClick={() => { setDays([...EVERY_DAY]); edited() }}>Every day</button>
            <span className={`rs-summary${days.length ? '' : ' rs-warn'}`}>{days.length ? `Runs ${daysLabel(days)}` : 'Choose at least one day'}</span>
          </div>
        </section>

        <section className="rs-section">
          <Label required>Passengers Choose Their</Label>
          <Segmented
            label="Passengers choose their"
            options={PASSENGER_CHOICES}
            value={passengerChooses}
            onChange={changeChoice}
          />
          <p className="rs-summary">
            {PASSENGER_CHOICES.find((c) => c.value === passengerChooses).hint} They pick in the app, from the stops you set below.
          </p>
        </section>

        <section className="rs-points">
          <Label required>Stops</Label>
          <div className="rs-row rs-point-row">
            <input
              className="rs-input rs-w-md"
              placeholder="Stop name..."
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveStop()
                if (e.key === 'Escape' && editingId) resetDraft()
              }}
            />
            <TimeInput
              aria-label="Stop time"
              className="rs-w-sm"
              value={draft.time}
              onChange={(time) => setDraft((d) => ({ ...d, time }))}
            />
            <select
              className="rs-input rs-role"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              aria-label="Stop type"
              title="Stop type"
            >
              {STOP_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className={`rs-wait${waitValid ? '' : ' bad'}`} title={`How long the driver waits here (0–${MAX_WAIT_MINUTES} min)`}>
              <input
                className="rs-input"
                type="number"
                min="0"
                max={MAX_WAIT_MINUTES}
                step="1"
                value={draft.wait}
                onChange={(e) => setDraft((d) => ({ ...d, wait: e.target.value }))}
                aria-label="Driver wait at this stop, in minutes"
              />
              <span>min wait</span>
            </label>
            <ChoosePoint location={draft.location} onClick={() => openModal('stop-point')} />
            <button
              type="button"
              className="rs-check"
              onClick={saveStop}
              disabled={!draftValid}
              aria-label={editingId ? 'Save stop' : 'Add stop'}
              title={draftValid ? (editingId ? 'Save stop' : 'Add stop') : !waitValid ? `Wait must be 0–${MAX_WAIT_MINUTES} whole minutes` : 'Enter a name, time and point first'}
            >
              <CheckIcon />
            </button>
            {editingId && (
              <button type="button" className="fl-clear rs-cancel-edit" onClick={resetDraft}>Cancel editing</button>
            )}
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table rs-stops">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stop Name</th>
                  <th>Time</th>
                  <th>Wait</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {stops.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={7}>No stops yet. Add at least {MIN_STOPS} to review the route.</td>
                  </tr>
                ) : (
                  stops.map((s, i) => (
                    <tr key={s.id} className={s.id === editingId ? 'editing' : ''}>
                      <td className="num">{i + 1}</td>
                      <td>{s.name}</td>
                      <td>{formatTime(s.time)}</td>
                      <td className="rs-wait-cell">{waitOf(s)} min</td>
                      <td><span className={`rs-role-pill ${stopRole(s)}`}>{roleLabel(s)}</span></td>
                      <td className="trunc">{formatCoords(s.location)}</td>
                      <td className="actions">
                        <button type="button" onClick={() => editStop(s)} aria-label={`Edit ${s.name}`}><PencilIcon /></button>
                        <button type="button" onClick={() => deleteStop(s.id)} aria-label={`Delete ${s.name}`}><TrashIcon /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {allowPassengers ? (
          <RoutePassengers
            value={passengers}
            onChange={(next) => { setPassengers(next); edited() }}
            stops={stops}
            users={users}
            capacity={vehicle?.capacity ?? null}
            choosesPickup={choosesPickup}
            choosesDropOff={choosesDropOff}
          />
        ) : (
          <p className="rp-locked rp-later">
            Passengers are added after the route is created. Press {submitLabel}, then use the Add passengers link (or edit the route from Route Management).
          </p>
        )}

        <div className="rs-footer">
          {notice && <span className="rs-notice">{notice}</span>}
          {days.length === 0 && <span className="rs-hint rs-warn">Choose at least one active day.</span>}
          {stopProblems.length > 0 && <span className="rs-hint rs-warn">Stops: {stopProblems.join('; ')}.</span>}
          {problems.length > 0 && <span className="rs-hint rs-warn">Passengers: {problems.join('; ')}.</span>}
          {initial && !dirty && <span className="rs-hint">No changes yet</span>}
          <button
            type="button"
            className="rs-review"
            disabled={!canReview}
            onClick={() => openModal('review')}
            title={canReview ? 'View the route on the map' : `Add at least ${MIN_STOPS} stops first`}
          >
            Review Route
          </button>
          {onCancel && (
            <button type="button" className="rs-review" onClick={onCancel}>Cancel</button>
          )}
          <button type="button" className={`rs-create${canSubmit ? ' ready' : ''}`} disabled={!canSubmit} onClick={handleSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>

      {modal === 'assignment' && (
        <Modal
          title="Vehicle & Driver"
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          canSubmit={!!(modalValues.vehicleId && modalValues.driverId)}
        >
          {vehicles.length ? (
            <SelectField
              label="Vehicle"
              required
              autoFocus
              options={[{ value: '', label: 'Select a vehicle…' }, ...vehicles.map((v) => ({ value: v.id, label: `${vehicleLabel(v)} (${v.capacity} seats)` }))]}
              value={modalValues.vehicleId}
              onChange={(e) => setModalValues((m) => ({ ...m, vehicleId: e.target.value }))}
            />
          ) : (
            <NoneRegistered what="vehicles" to="/fleet" />
          )}
          {drivers.length ? (
            <SelectField
              label="Driver"
              required
              options={[{ value: '', label: 'Select a driver…' }, ...drivers.map((u) => ({ value: u.id, label: `${u.name} · ${u.phone}` }))]}
              value={modalValues.driverId}
              onChange={(e) => setModalValues((m) => ({ ...m, driverId: e.target.value }))}
            />
          ) : (
            <NoneRegistered what="drivers" to="/users?type=driver" />
          )}
        </Modal>
      )}

      {modal === 'supervisor' && (
        <Modal title="Add Supervisor" onClose={() => setModal(null)} onSubmit={submitModal}>
          {supervisors.length ? (
            <SelectField
              label="Supervisor"
              autoFocus
              options={[{ value: '', label: 'No supervisor' }, ...supervisors.map((u) => ({ value: u.id, label: `${u.name} · ${u.phone}` }))]}
              value={modalValues.supervisorId}
              onChange={(e) => setModalValues({ supervisorId: e.target.value })}
            />
          ) : (
            <NoneRegistered what="supervisors" to="/users?type=supervisor" />
          )}
        </Modal>
      )}

      {modal === 'stop-point' && (
        <Modal
          title="Choose Point"
          wide
          submitLabel="Confirm"
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          canSubmit={!!modalValues.location}
        >
          <MapPicker value={modalValues.location} onChange={(location) => setModalValues({ location })} />
        </Modal>
      )}

      {modal === 'review' && (
        <Modal title={routeName.trim() ? `Review: ${routeName.trim()}` : 'Review Route'} wide onClose={() => setModal(null)}>
          <RouteReview stops={stops} passengers={passengers} />
        </Modal>
      )}
    </>
  )
}
