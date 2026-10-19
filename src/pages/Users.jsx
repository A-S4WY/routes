import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Modal from '../components/Modal.jsx'
import Dropdown from '../components/Dropdown.jsx'
import { TextField, SelectField, RequiredNote } from '../components/FormFields.jsx'
import { PencilIcon, TrashIcon } from '../components/Icons.jsx'
import { USER_TYPES } from '../data/users.js'
import { usersStore, useCollection } from '../data/store.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'
import '../users.css'

const SEARCH_FIELDS = [
  { value: 'all', label: 'All fields' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'E-Mail' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'otherId', label: 'ID / Other' },
]

const STATUS_OPTIONS = [
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
]

const TYPE_LABEL = Object.fromEntries(USER_TYPES.map((t) => [t.value, t.label]))
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emptyUser(type) {
  return { type, name: '', email: '', phone: '', status: 'subscribed', otherId: '' }
}

// Phone numbers are compared by digits only, so "+20 100" matches "+20100".
function digits(value) {
  return value.replace(/\D/g, '')
}

function matches(user, field, query) {
  const fields = field === 'all' ? ['name', 'email', 'phone', 'otherId'] : [field]
  return fields.some((f) => {
    const value = user[f] ?? ''
    if (f === 'phone' && digits(query)) return digits(value).includes(digits(query))
    return value.toLowerCase().includes(query)
  })
}

function Status({ status }) {
  if (!status) return <span className="us-none">—</span>
  return (
    <span className={`us-status ${status}`}>
      <span className="us-dot" aria-hidden="true" />
      {status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
    </span>
  )
}

export default function Users() {
  // The type filter lives in the URL (?type=driver) so the sidebar submenu
  // and the Filters panel always agree.
  const [params, setParams] = useSearchParams()
  const typeFilter = USER_TYPES.find((t) => t.value === params.get('type')) ?? null

  const [users, setUsers] = useCollection(usersStore)
  const [search, setSearch] = useState('')
  const [searchBy, setSearchBy] = useState('all')
  const [statusFilter, setStatusFilter] = useState('') // '' | 'subscribed' | 'unsubscribed'

  // modal: { kind: 'details', id } | { kind: 'edit', id: string|null } | { kind: 'delete', user } | null
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyUser('passenger'))

  const query = search.trim().toLowerCase()
  const visible = users.filter((u) =>
    (!typeFilter || u.type === typeFilter.value) &&
    (!statusFilter || u.status === statusFilter) &&
    (!query || matches(u, searchBy, query)),
  )
  const activeFilters = (searchBy !== 'all' ? 1 : 0) + (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0)

  function setTypeFilter(type) {
    setParams(type ? { type } : {})
  }

  function clearFilters() {
    setSearchBy('all')
    setStatusFilter('')
    setTypeFilter('')
  }

  const isPassenger = form.type === 'passenger'
  const missing = [
    !form.name.trim() && 'name',
    !EMAIL_RE.test(form.email.trim()) && 'valid e-mail',
    digits(form.phone).length < 8 && 'phone number (at least 8 digits)',
    !form.otherId.trim() && 'ID / joining requirement',
  ].filter(Boolean)
  const searchByLabel = SEARCH_FIELDS.find((f) => f.value === searchBy).label

  function openEditor(user) {
    setForm(user ? { ...user, status: user.status ?? 'subscribed' } : emptyUser(typeFilter?.value ?? 'passenger'))
    setModal({ kind: 'edit', id: user?.id ?? null })
  }

  function saveUser() {
    const data = {
      type: form.type,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: isPassenger ? form.status : null,
      otherId: form.otherId.trim(),
    }
    // TODO: send to backend once a users endpoint exists.
    setUsers((all) =>
      modal.id
        ? all.map((u) => (u.id === modal.id ? { ...data, id: u.id } : u))
        : [...all, { ...data, id: crypto.randomUUID() }],
    )
    setModal(null)
  }

  function deleteUser() {
    // TODO: delete on backend once a users endpoint exists.
    setUsers((all) => all.filter((u) => u.id !== modal.user.id))
    setModal(null)
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const openDetails = (id) => setModal({ kind: 'details', id })

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <div className="rs">
          <h1 className="rs-title">{typeFilter ? typeFilter.plural : 'Users'}</h1>

          <div className="fl-toolbar">
            <input
              className="rs-input fl-search"
              type="search"
              placeholder={searchBy === 'all' ? 'Search....' : `Search by ${searchByLabel.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
            <Dropdown label="Filters" count={activeFilters}>
              <SelectField
                label="Search in"
                options={SEARCH_FIELDS}
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              />
              <SelectField
                label="Type"
                options={[{ value: '', label: 'All types' }, ...USER_TYPES.map(({ value, plural }) => ({ value, label: plural }))]}
                value={typeFilter?.value ?? ''}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
              <SelectField
                label="Status (passengers)"
                options={[{ value: '', label: 'Any status' }, ...STATUS_OPTIONS]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <button type="button" className="fl-clear" disabled={!activeFilters} onClick={clearFilters}>
                Clear filters
              </button>
            </Dropdown>
            <button type="button" className="rs-btn fl-add" onClick={() => openEditor(null)}>Add</button>
          </div>

          <div className="rs-table-wrap">
            <table className="rs-table fl-table us-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Other (ID or other requirement before joining)</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="empty">
                    <td colSpan={7}>
                      {query ? 'No users match your search.' : `No ${typeFilter ? typeFilter.plural.toLowerCase() : 'users'} yet. Use Add to create one.`}
                    </td>
                  </tr>
                ) : (
                  visible.map((u) => (
                    <tr
                      key={u.id}
                      className="fl-row"
                      tabIndex={0}
                      title="View details"
                      onClick={() => openDetails(u.id)}
                      onKeyDown={(e) => {
                        // Only when the row itself is focused, not its edit/delete buttons.
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          openDetails(u.id)
                        }
                      }}
                    >
                      <td>{TYPE_LABEL[u.type]}</td>
                      <td>{u.name}</td>
                      <td className="us-email">{u.email}</td>
                      <td className="us-phone">{u.phone}</td>
                      <td><Status status={u.status} /></td>
                      <td>{u.otherId}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => openEditor(u)} aria-label={`Edit ${u.name}`}><PencilIcon /></button>
                        <button type="button" onClick={() => setModal({ kind: 'delete', user: u })} aria-label={`Delete ${u.name}`}><TrashIcon /></button>
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
        const user = users.find((u) => u.id === modal.id)
        if (!user) return null
        return (
          <Modal
            title="User Details"
            submitLabel="Edit"
            cancelLabel="Close"
            onClose={() => setModal(null)}
            onSubmit={() => openEditor(user)}
          >
            <div className="fl-info">
              <dl>
                <dt>Type</dt>
                <dd>{TYPE_LABEL[user.type]}</dd>
                <dt>Name</dt>
                <dd>{user.name}</dd>
                <dt>E-Mail</dt>
                <dd className="us-email">{user.email}</dd>
                <dt>Phone</dt>
                <dd className="us-phone">{user.phone}</dd>
                <dt>Status</dt>
                <dd><Status status={user.status} /></dd>
                <dt>ID / Other</dt>
                <dd>{user.otherId}</dd>
              </dl>
            </div>
          </Modal>
        )
      })()}

      {modal?.kind === 'edit' && (
        <Modal
          title={modal.id ? 'Edit User' : 'Add User'}
          submitLabel={modal.id ? 'Save' : 'Add'}
          onClose={() => setModal(null)}
          onSubmit={saveUser}
          canSubmit={missing.length === 0}
        >
          <SelectField
            label="Type"
            required
            options={USER_TYPES.map(({ value, label }) => ({ value, label }))}
            value={form.type}
            onChange={set('type')}
          />
          <TextField label="Name" required autoFocus placeholder="e.g. Salma Maged" value={form.name} onChange={set('name')} />
          <TextField label="E-Mail" required type="email" placeholder="e.g. name@example.com" value={form.email} onChange={set('email')} />
          <TextField label="Phone number" required type="tel" placeholder="e.g. +20 100 200 7299" value={form.phone} onChange={set('phone')} />
          {isPassenger && (
            <SelectField label="Status" required options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          )}
          <TextField
            label="ID or other requirement before joining"
            required
            placeholder="e.g. 21-101096"
            value={form.otherId}
            onChange={set('otherId')}
          />
          <RequiredNote missing={missing} />
        </Modal>
      )}

      {modal?.kind === 'delete' && (
        <Modal title="Delete User" submitLabel="Delete" onClose={() => setModal(null)} onSubmit={deleteUser}>
          <p className="fl-confirm">
            Remove <strong>{modal.user.name}</strong> ({TYPE_LABEL[modal.user.type]}) from the system? This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
