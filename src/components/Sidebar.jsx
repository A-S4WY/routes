import { useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { Home, Route, Truck, Users, ChevronDown, QrCode, FileText, Calendar } from 'lucide-react'
import { USER_TYPES } from '../data/users.js'

export default function Sidebar() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const activeType = params.get('type')
  // The Users submenu starts open while you're on a Users page.
  const [usersOpen, setUsersOpen] = useState(pathname.startsWith('/users'))

  return (
    <div className="left-col">
      <div className="brand-bar">
        <div className="brand-mark">
          <div className="pill"></div>
          <div className="dot"></div>
        </div>
        <span className="brand-name">ROUTES</span>
      </div>

      <nav className="nav-panel">
        <div className="profile">
          <img
            className="avatar"
            src="https://api.dicebear.com/7.x/initials/svg?seed=Ali%20Elsawy&backgroundColor=2fb31c&textColor=ffffff"
            alt="Ali Elsawy"
          />
          <div className="profile-text">
            <div className="profile-name">Ali Elsawy</div>
            <div className="profile-role">Manager</div>
          </div>
        </div>

        <ul className="nav-list">
          <li>
            <NavLink to="/dashboard" className="nav-item">
              <Home size={16} />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/route-setup" className="nav-item">
              <Route size={16} />
              <span>Route Setup</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/fleet" className="nav-item">
              <Truck size={16} />
              <span>Fleet Managment</span>
            </NavLink>
          </li>
          <li>
            <div className="nav-row">
              <NavLink to="/users" className="nav-item">
                <Users size={16} />
                <span>Users</span>
              </NavLink>
              <button
                type="button"
                className="nav-toggle"
                aria-expanded={usersOpen}
                aria-label={usersOpen ? 'Hide user types' : 'Show user types'}
                onClick={() => setUsersOpen((o) => !o)}
              >
                <ChevronDown size={14} className={usersOpen ? 'flip' : ''} />
              </button>
            </div>
            {usersOpen && (
              <ul className="nav-sub">
                {USER_TYPES.map((t) => (
                  <li key={t.value}>
                    <Link
                      to={`/users?type=${t.value}`}
                      className={`nav-sublink${pathname === '/users' && activeType === t.value ? ' active' : ''}`}
                    >
                      {t.plural}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <NavLink to="/route-management" className="nav-item">
              <Route size={16} />
              <span>Route Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/qr" className="nav-item">
              <QrCode size={16} />
              <span>QR Creation</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className="nav-item">
              <FileText size={16} />
              <span>Reports</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/calendar" className="nav-item">
              <Calendar size={16} />
              <span>Calendar</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}
