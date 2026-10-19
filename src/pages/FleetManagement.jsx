import { useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import Dropdown from '../components/Dropdown.jsx'
import { TextField, FileField, RequiredNote } from '../components/FormFields.jsx'
import VehicleDetails from '../components/VehicleDetails.jsx'
import { PencilIcon, TrashIcon } from '../components/Icons.jsx'
import { vehiclesStore, useCollection } from '../data/store.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'

const EMPTY_VEHICLE = { plate: '', model: '', capacity: '', color: '', licenseFile: null, photos: [] }
// minCapacity / maxCapacity are input strings; '' means no limit.
const NO_FILTERS = { model: '', color: '', minCapacity: '', maxCapacity: '', missingDocs: false }

function photosLabel(photos) {
  if (!photos.length) return 'No photos'
  return `${photos.length} photo${photos.length === 1 ? '' : 's'} uploaded`
}

function isMissingDocs(v) {
  return !v.licenseFile || v.photos.length === 0
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function FiltersMenu({ filters, onChange, models, colors }) {
  const activeCount =
    (filters.model ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.minCapacity || filters.maxCapacity ? 1 : 0) +
    (filters.missingDocs ? 1 : 0)

  return (
    <Dropdown label="Filters" count={activeCount}>
      <label className="fl-field">
        <span className="fl-field-label">Model</span>
        <select className="rs-input" value={filters.model} onChange={(e) => onChange({ ...filters, model: e.target.value })}>
          <option value="">All models</option>
          {models.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label className="fl-field">
        <span className="fl-field-label">Color</span>
        <select className="rs-input" value={filters.color} onChange={(e) => onChange({ ...filters, color: e.target.value })}>
          <option value="">All colors</option>
          {colors.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <div className="fl-field">
        <span className="fl-field-label">Capacity (seats)</span>
        <div className="fl-pair">
          <input
            className="rs-input"
            type="number"
            min="1"
            placeholder="Min"
            aria-label="Minimum capacity"
            value={filters.minCapacity}
            onChange={(e) => onChange({ ...filters, minCapacity: e.target.value })}
          />
          <input
            className="rs-input"
            type="number"
            min="1"
            placeholder="Max"
            aria-label="Maximum capacity"
            value={filters.maxCapacity}
            onChange={(e) => onChange({ ...filters, maxCapacity: e.target.value })}
          />
        </div>
      </div>
      <label className="fl-check">
        <input
          type="checkbox"
          checked={filters.missingDocs}
          onChange={(e) => onChange({ ...filters, missingDocs: e.target.checked })}
        />
        Missing license or photos
      </label>
      <button type="button" className="fl-clear" disabled={!activeCount} onClick={() => onChange(NO_FILTERS)}>
        Clear filters
      </button>
    </Dropdown>
  )
}

export default function FleetManagement() {
  const [vehicles, setVehicles] = useCollection(vehiclesStore)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)

  // modal: { kind: 'details', id } | { kind: 'edit', id: string|null } | { kind: 'delete', vehicle } | null
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_VEHICLE)

  const models = useMemo(() => uniqueSorted(vehicles.map((v) => v.model)), [vehicles])
  const colors = useMemo(() => uniqueSorted(vehicles.map((v) => v.color)), [vehicles])

  const query = search.trim().toLowerCase()
  const visible = vehicles.filter((v) =>
    (!query || [v.plate, v.model, v.color].some((f) => f.toLowerCase().includes(query))) &&
    (!filters.model || v.model === filters.model) &&
    (!filters.color || v.color === filters.color) &&
    (filters.minCapacity === '' || v.capacity >= Number(filters.minCapacity)) &&
    (filters.maxCapacity === '' || v.capacity <= Number(filters.maxCapacity)) &&
    (!filters.missingDocs || isMissingDocs(v)),
  )

  const capacity = Number(form.capacity)
  // Required fields still missing, in form order — shown under the form.
  const missing = [
    !form.plate.trim() && 'license plate',
    !form.model.trim() && 'vehicle model',
    !(Number.isInteger(capacity) && capacity > 0) && 'capacity (whole number above 0)',
    !form.color.trim() && 'color',
    !form.licenseFile && 'vehicle license',
  ].filter(Boolean)
  const formValid = missing.length === 0

  function openEditor(vehicle) {
    setForm(vehicle ? { ...vehicle, capacity: String(vehicle.capacity) } : EMPTY_VEHICLE)
    setModal({ kind: 'edit', id: vehicle?.id ?? null })
  }

  function saveVehicle() {
    const data = {
      ...form,
      plate: form.plate.trim(),
      model: form.model.trim(),
      color: form.color.trim(),
      capacity,
    }
    // TODO: send to backend (with file uploads) once a vehicles endpoint exists.
    setVehicles((all) =>
      modal.id
        ? all.map((v) => (v.id === modal.id ? { ...data, id: v.id } : v))
        : [...all, { ...data, id: crypto.randomUUID() }],
    )
    setModal(null)
  }

  function deleteVehicle() {
    // TODO: delete on backend once a vehicles endpoint exists.
    setVehicles((all) => all.filter((v) => v.id !== modal.vehicle.id))
    setModal(null)
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">Fleet Management</h1>

          <div className="fl-toolbar">
            <input
              className="rs-input fl-search"
              type="search"
              placeholder="Search...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search vehicles"
            />
            <FiltersMenu filters={filters} onChange={setFilters} models={models} colors={colors} />
            <button type="button" className="rs-btn fl-add" onClick={() => openEditor(null)}>Add</button>
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table fl-table">
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Vehicle Model</th>
                  <th>Capacity</th>
                  <th>Color</th>
                  <th>Vehicle License</th>
                  <th>Vehicle Photos</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={7}>
                      {vehicles.length === 0 ? 'No vehicles yet. Use Add to register one.' : 'No vehicles match your search or filters.'}
                    </td>
                  </tr>
                ) : (
                  visible.map((v) => (
                    <tr
                      key={v.id}
                      className="fl-row"
                      tabIndex={0}
                      title="View details"
                      onClick={() => setModal({ kind: 'details', id: v.id })}
                      onKeyDown={(e) => {
                        // Only when the row itself is focused, not its edit/delete buttons.
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          setModal({ kind: 'details', id: v.id })
                        }
                      }}
                    >
                      <td className="fl-plate" dir="auto">{v.plate}</td>
                      <td>{v.model}</td>
                      <td>{v.capacity}</td>
                      <td>{v.color}</td>
                      <td className={v.licenseFile ? '' : 'fl-missing'}>{v.licenseFile ? 'Uploaded' : 'Not uploaded'}</td>
                      <td className={v.photos.length ? '' : 'fl-missing'}>{photosLabel(v.photos)}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => openEditor(v)} aria-label={`Edit ${v.plate}`}><PencilIcon /></button>
                        <button type="button" onClick={() => setModal({ kind: 'delete', vehicle: v })} aria-label={`Delete ${v.plate}`}><TrashIcon /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modal?.kind === 'details' && (() => {
        const vehicle = vehicles.find((v) => v.id === modal.id)
        if (!vehicle) return null
        return (
          <Modal
            title="Vehicle Details"
            wide
            submitLabel="Edit"
            cancelLabel="Close"
            onClose={() => setModal(null)}
            onSubmit={() => openEditor(vehicle)}
          >
            <VehicleDetails vehicle={vehicle} />
          </Modal>
        )
      })()}

      {modal?.kind === 'edit' && (
        <Modal
          title={modal.id ? 'Edit Vehicle' : 'Add Vehicle'}
          submitLabel={modal.id ? 'Save' : 'Add'}
          onClose={() => setModal(null)}
          onSubmit={saveVehicle}
          canSubmit={formValid}
        >
          <TextField label="License plate" required autoFocus dir="auto" placeholder="e.g. 1 2 1 س س ش" value={form.plate} onChange={set('plate')} />
          <TextField label="Vehicle model" required placeholder="e.g. Toyota Hiace" value={form.model} onChange={set('model')} />
          <div className="fl-pair">
            <TextField label="Capacity (seats)" required type="number" min="1" step="1" placeholder="e.g. 13" value={form.capacity} onChange={set('capacity')} />
            <TextField label="Color" required placeholder="e.g. White" value={form.color} onChange={set('color')} />
          </div>
          <FileField
            label="Vehicle license photo"
            required
            accept="image/*,.pdf"
            value={form.licenseFile}
            onChange={(licenseFile) => setForm((f) => ({ ...f, licenseFile }))}
          />
          <FileField
            label="Vehicle photos"
            accept="image/*"
            multiple
            value={form.photos}
            onChange={(photos) => setForm((f) => ({ ...f, photos }))}
          />
          <RequiredNote missing={missing} />
        </Modal>
      )}

      {modal?.kind === 'delete' && (
        <Modal title="Delete Vehicle" submitLabel="Delete" onClose={() => setModal(null)} onSubmit={deleteVehicle}>
          <p className="fl-confirm">
            Remove <strong dir="auto">{modal.vehicle.plate}</strong> ({modal.vehicle.model}) from the fleet? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
