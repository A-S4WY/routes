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
  pages/
    Login.jsx         — username + password
    Signup.jsx         — username + email + password
  App.jsx              — routes (/login, /signup)
  main.jsx             — React entry point
  styles.css           — all styling (same design as the static version)
```

## Connecting to a real backend

Both `Login.jsx` and `Signup.jsx` have a `handleSubmit` function with a
`// TODO` comment marking where to send the form data to your API and
where to `navigate()` on success (e.g. to `/dashboard` after login).

## Next steps

- Add a `Dashboard.jsx` page and register it in `App.jsx`
- Wire up real authentication in `handleSubmit`
- Consider adding a loading/error state to the forms once the API is connected
