import { Search, ListFilter } from 'lucide-react'

export default function RouteList({ routes, search, onSearchChange, onSelectRoute }) {
  return (
    <div className="route-col">
      <h2 className="route-title">Route List</h2>

      <div className="route-toolbar">
        <div className="search-box">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="filter-btn" type="button" aria-label="Filter">
          <ListFilter size={13} />
        </button>
      </div>

      <ul className="route-list">
        {routes.map((route, index) => (
          <li
            key={index}
            className="route-item"
            onClick={() => onSelectRoute(route)}
          >
            <div className="route-item-name">{route.name}</div>
            <div className="route-item-time">Starts at {route.startsAt}</div>
            {route.eta && <div className="route-item-eta">ETA: {route.eta}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
