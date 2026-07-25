import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { passengerSignup } from '../api/user.ts'

export default function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isFilled =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    const passengerInfo = {
      email: email,
      // TODO: Get the rest of the passenger information.
    }
    const response = await passengerSignup(username, password, passengerInfo)
    const bodyJson = await response.json()
    if (response.status === 201) {
      navigate('/login')
    }
    else {
      console.error('Signup failed:', bodyJson)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <p className="switch-auth">
          Already have an account? <Link to="/login">Log in</Link>
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
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="submit">Sign up</button>
      </form>
    </AuthLayout>
  )
}
