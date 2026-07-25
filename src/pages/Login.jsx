import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const isFilled = username.trim().length > 0 && password.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: send { username, password, remember } to your auth API.
    // On success:
    // navigate('/dashboard')
  }

  return (
    <AuthLayout
      title="Routes Admin Dashboard"
      footer={
        <p className="switch-auth">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className={isFilled ? 'filled' : ''}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="remember">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="remember">Remember this Device</label>
        </div>

        <button type="submit" className="submit">Log-in</button>
      </form>
    </AuthLayout>
  )
}
