import { Link, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import RouteForm from '../components/RouteForm.jsx'
import { routesStore, useCollection } from '../data/store.js'
import '../dashboard.css'
import '../route-setup.css'
import '../fleet.css'

// Same form as Route Setup, pre-filled with an existing route. Nothing is
// stored until Save is pressed; Cancel discards the edits.
export default function RouteEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [routes, setRoutes] = useCollection(routesStore)
  const route = routes.find((r) => r.id === id)

  function handleSave(data) {
    // TODO: send to backend once a routes endpoint exists.
    setRoutes((all) => all.map((r) => (r.id === id ? { ...data, id } : r)))
    navigate('/route-management', { state: { saved: data.name } })
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="rs-main">
        {route ? (
          <RouteForm
            key={id}
            title={`Edit Route: ${route.name}`}
            initial={route}
            submitLabel="Save"
            onSubmit={handleSave}
            onCancel={() => navigate('/route-management')}
          />
        ) : (
          <div className="rs">
            <h1 className="rs-title">Route not found</h1>
            <p className="rs-none">
              This route may have been deleted. <Link to="/route-management">Back to Route Management</Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
