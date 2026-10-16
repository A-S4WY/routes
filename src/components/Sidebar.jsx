import { Home, Route, Truck, Users, ChevronDown, QrCode, FileText, Calendar } from 'lucide-react'

export default function Sidebar() {
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
          <li className="nav-item active">
            <Home size={16} />
            <span>Home</span>
          </li>
          <li className="nav-item">
            <Route size={16} />
            <span>Route Setup</span>
          </li>
          <li className="nav-item">
            <Truck size={16} />
            <span>Fleet Managment</span>
          </li>
          <li className="nav-item has-chevron">
            <Users size={16} />
            <span>Users</span>
            <ChevronDown size={14} className="chevron" />
          </li>
          <li className="nav-item">
            <Route size={16} />
            <span>Route Management</span>
          </li>
          <li className="nav-item">
            <QrCode size={16} />
            <span>QR Creation</span>
          </li>
          <li className="nav-item">
            <FileText size={16} />
            <span>Reports</span>
          </li>
          <li className="nav-item">
            <Calendar size={16} />
            <span>Calendar</span>
          </li>
        </ul>
      </nav>
    </div>
  )
}
