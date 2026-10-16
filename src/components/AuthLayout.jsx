export default function AuthLayout({ title, children, footer }) {
  return (
    <div className="screen">
      <div className="card">

        {/* Left promo panel */}
        <div className="promo">
          <h1>Routes Management<br />Made Easier</h1>
        </div>

        {/* Right auth panel */}
        <div className="auth">
          <div className="logo">
            <div className="pill"></div>
            <div className="dot"></div>
          </div>

          <h2>{title}</h2>

          {children}

          {footer}
        </div>

      </div>
    </div>
  )
}
