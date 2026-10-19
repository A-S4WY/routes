import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RouteSetup from './pages/RouteSetup.jsx'
import FleetManagement from './pages/FleetManagement.jsx'
import Users from './pages/Users.jsx'
import RouteManagement from './pages/RouteManagement.jsx'
import RouteEdit from './pages/RouteEdit.jsx'
import QrCreation from './pages/QrCreation.jsx'
import Reports from './pages/Reports.jsx'
import CalendarPage from './pages/CalendarPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/route-setup" element={<RouteSetup />} />
        <Route path="/fleet" element={<FleetManagement />} />
        <Route path="/users" element={<Users />} />
        <Route path="/route-management" element={<RouteManagement />} />
        <Route path="/route-management/:id" element={<RouteEdit />} />
        <Route path="/qr" element={<QrCreation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/calendar" element={<CalendarPage />} />
        {/* Add your dashboard route here once it's built, e.g.: */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </BrowserRouter>
  )
}
