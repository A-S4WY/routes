import { useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import MapPicker, { formatCoords } from '../components/MapPicker.jsx'
import RouteReview from '../components/RouteReview.jsx'
import { PinIcon, PencilIcon, TrashIcon, CheckIcon, PlusIcon } from '../components/Icons.jsx'
import '../dashboard.css'
import '../route-setup.css'

// location is { lat, lng } once picked on the map, otherwise null.
const EMPTY_DRAFT = { name: '', time: '', location: null }

// A route needs a start and an end.
const MIN_STOPS = 2

// "07:30" -> "7:30 AM"
function formatTime(value) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

// Stops are always kept in time order ("HH:MM" strings sort correctly).
function sortByTime(stops) {
  return [...stops].sort((a, b) => a.time.localeCompare(b.time))
}

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

export default function RouteSetup() {
  const [routeName, setRouteName] = useState('')
  const [assignment, setAssignment] = useState(null) // { vehicle, driver }
  const [supervisor, setSupervisor] = useState('')

  const [stops, setStops] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState(null)

  // Which modal is open: 'assignment' | 'supervisor' | 'stop-point' | 'review' | null
  const [modal, setModal] = useState(null)
  const [modalValues, setModalValues] = useState({})
  const [notice, setNotice] = useState('')

  const draftValid = draft.name.trim() && draft.time && draft.location
  const canReview = stops.length >= MIN_STOPS
  const canCreate = routeName.trim() && assignment && canReview

  function openModal(kind) {
    const initial = {
      assignment: { vehicle: assignment?.vehicle ?? '', driver: assignment?.driver ?? '' },
      supervisor: { supervisor },
      'stop-point': { location: draft.location },
      review: {},
    }[kind]
    setModalValues(initial)
    setModal(kind)
  }

  function submitModal() {
    if (modal === 'assignment') setAssignment({ vehicle: modalValues.vehicle.trim(), driver: modalValues.driver.trim() })
    if (modal === 'supervisor') setSupervisor(modalValues.supervisor.trim())
    if (modal === 'stop-point') setDraft((d) => ({ ...d, location: modalValues.location }))
    setModal(null)
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
  }

  function saveStop() {
    if (!draftValid) return
    const stop = { ...draft, name: draft.name.trim() }
    setStops((all) =>
      sortByTime(
        editingId
          ? all.map((s) => (s.id === editingId ? { ...s, ...stop } : s))
          : [...all, { ...stop, id: crypto.randomUUID() }],
      ),
    )
    resetDraft()
  }

  function editStop(s) {
    setDraft({ name: s.name, time: s.time, location: s.location })
    setEditingId(s.id)
  }

  function deleteStop(id) {
    setStops((all) => all.filter((s) => s.id !== id))
    if (editingId === id) resetDraft()
  }

  function handleCreate() {
    if (!canCreate) return
    const payload = {
      name: routeName.trim(),
      vehicle: assignment.vehicle,
      driver: assignment.driver,
      supervisor: supervisor || null,
      stops: stops.map(({ id, ...s }, i) => ({ order: i + 1, ...s })),
    }
    // TODO: send to backend once a routes endpoint exists.
    console.log('Create route:', payload)
    setNotice(`Route "${payload.name}" created.`)
    setRouteName('')
    setAssignment(null)
    setSupervisor('')
    setStops([])
    resetDraft()
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">Route Setup</h1>

          <section className="rs-section">
            <Label required>Route Name</Label>
            <input
              className="rs-input rs-w-lg"
              placeholder="Route name..."
              value={routeName}
              onChange={(e) => { setRouteName(e.target.value); setNotice('') }}
            />
          </section>

          <section className="rs-section rs-row rs-row-assign">
            <div className="rs-col-assign">
              <Label required>Vehicle &amp; Driver Selection</Label>
              <button type="button" className="rs-btn" onClick={() => openModal('assignment')}>Select</button>
              {assignment && (
                <p className="rs-summary">{assignment.vehicle} · {assignment.driver}</p>
              )}
            </div>
            <div>
              <Label>Add Supervisor</Label>
              <button type="button" className="rs-btn" onClick={() => openModal('supervisor')}>Add</button>
              {supervisor && <p className="rs-summary">{supervisor}</p>}
            </div>
          </section>

          <section className="rs-points">
            <Label required>Stops</Label>
            <div className="rs-row rs-point-row">
              <input
                className="rs-input rs-w-md"
                placeholder="Stop name..."
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && saveStop()}
              />
              <TimeInput
                aria-label="Stop time"
                className="rs-w-sm"
                value={draft.time}
                onChange={(time) => setDraft((d) => ({ ...d, time }))}
              />
              <ChoosePoint location={draft.location} onClick={() => openModal('stop-point')} />
              <button
                type="button"
                className="rs-check"
                onClick={saveStop}
                disabled={!draftValid}
                aria-label={editingId ? 'Save stop' : 'Add stop'}
                title={draftValid ? (editingId ? 'Save stop' : 'Add stop') : 'Enter a name, time and point first'}
              >
                <CheckIcon />
              </button>
            </div>

            <button type="button" className="rs-new" onClick={resetDraft}>
              <span className="box"><PlusIcon /></span>
              New Stop
            </button>

            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Stop Name</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {stops.length === 0 ? (
                    <tr className="empty">
                      <td colSpan={5}>No stops yet. Add at least {MIN_STOPS} to review the route.</td>
                    </tr>
                  ) : (
                    stops.map((s, i) => (
                      <tr key={s.id} className={s.id === editingId ? 'editing' : ''}>
                        <td className="num">{i + 1}</td>
                        <td>{s.name}</td>
                        <td>{formatTime(s.time)}</td>
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

          <div className="rs-footer">
            {notice && <span className="rs-notice">{notice}</span>}
            <button
              type="button"
              className="rs-review"
              disabled={!canReview}
              onClick={() => openModal('review')}
              title={canReview ? 'View the route on the map' : `Add at least ${MIN_STOPS} stops first`}
            >
              Review Route
            </button>
            <button type="button" className={`rs-create${canCreate ? ' ready' : ''}`} disabled={!canCreate} onClick={handleCreate}>
              Create
            </button>
          </div>
        </div>
      </main>

      {modal === 'assignment' && (
        <Modal
          title="Vehicle & Driver"
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          canSubmit={!!(modalValues.vehicle?.trim() && modalValues.driver?.trim())}
        >
          <input className="rs-input" autoFocus placeholder="Vehicle (plate / number)..." value={modalValues.vehicle} onChange={(e) => setModalValues((v) => ({ ...v, vehicle: e.target.value }))} />
          <input className="rs-input" placeholder="Driver name..." value={modalValues.driver} onChange={(e) => setModalValues((v) => ({ ...v, driver: e.target.value }))} />
        </Modal>
      )}

      {modal === 'supervisor' && (
        <Modal title="Add Supervisor" onClose={() => setModal(null)} onSubmit={submitModal} canSubmit={!!modalValues.supervisor?.trim()}>
          <input className="rs-input" autoFocus placeholder="Supervisor name..." value={modalValues.supervisor} onChange={(e) => setModalValues({ supervisor: e.target.value })} />
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
          <RouteReview stops={stops} />
        </Modal>
      )}
    </div>
  )
}
