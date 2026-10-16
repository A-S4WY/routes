# Routes Admin — Auth Pages (React)

A Vite + React version of the login and signup pages, with the same
visual design as the original static HTML build.

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).
It redirects to `/login` by default; visit `/signup` for the other page.

## Structure

```
src/
  components/
    AuthLayout.jsx   — shared split-screen layout (green promo panel + logo)
    Sidebar.jsx       — dashboard sidebar: profile + nav
    MapView.jsx       — MapLibre GL map with a custom dark style, plots
                         markers, draws the TomTom route path when a
                         route is selected, exposes focusRoute() and
                         showRoutePath() handles
    RouteList.jsx     — right-hand route list, with search
  pages/
    Login.jsx          — username + password
    Signup.jsx         — username + email + password
    Dashboard.jsx       — home screen: sidebar + map + route list
  data/
    routes.js           — static placeholder route data
  utils/
    tomtom.js            — calls TomTom's Routing API; returns both the
                            live-traffic ETA and the route's path geometry
  mapStyle.json           — custom dark MapLibre style (OpenFreeMap/OSM
                            vector tiles, fully recolored)
  config.js               — TomTom API key, map defaults, depot location
  App.jsx              — routes (/login, /signup, /dashboard)
  main.jsx             — React entry point
  styles.css           — auth page styling
  dashboard.css        — dashboard page styling
```

## Connecting to a real backend

Both `Login.jsx` and `Signup.jsx` have a `handleSubmit` function with a
`// TODO` comment marking where to send the form data to your API.
`Login.jsx` currently navigates straight to `/dashboard` on submit as a
placeholder — swap that for a real API call once you have one, and only
navigate after a successful response.

`Dashboard.jsx` calculates each route's travel time by calling TomTom's
Routing API (`src/utils/tomtom.js`) against a fixed depot location
(`DEPOT` in `src/config.js`) — update that to your actual starting point.
Route data lives in `src/data/routes.js`; swap the static array for a
`fetch()` call whenever you connect a backend.

## Next steps

- Replace placeholder route/depot coordinates with real ones
- Wire up real authentication in `handleSubmit`
- Consider adding a loading/error state to the forms once the API is connected
