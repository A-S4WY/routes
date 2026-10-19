import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import RouteForm from '../components/RouteForm.jsx'
import { routesStore } from '../data/store.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'

export default function RouteSetup() {
  // Bumping the key remounts the form, clearing it after a route is created.
  const [formKey, setFormKey] = useState(0)
  const [created, setCreated] = useState(null) // { id, name } of the last route created

  function handleCreate(route) {
    // TODO: send to backend once a routes endpoint exists.
    const id = crypto.randomUUID()
    routesStore.set((all) => [...all, { ...route, id }])
    setCreated({ id, name: route.name })
    setFormKey((k) => k + 1)
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        <RouteForm
          key={formKey}
          title="Route Setup"
          submitLabel="Create"
          onSubmit={handleCreate}
          onChange={() => setCreated(null)}
          allowPassengers={false}
          notice={created && (
            <>
              Route "{created.name}" created. <Link to={`/route-management/${created.id}`}>Add passengers</Link>
              {' · '}<Link to="/route-management">View in Route Management</Link>
            </>
          )}
        />
      </main>
    </div>
  )
}
