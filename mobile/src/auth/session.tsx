import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from './api'

// Who is signed in. Kept in memory for now (signing in again after the app
// restarts); persisting a token comes with the real backend.
type Session = {
  user: User | null
  signIn: (user: User) => void
  signOut: () => void
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <SessionContext value={{ user, signIn: setUser, signOut: () => setUser(null) }}>
      {children}
    </SessionContext>
  )
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside <SessionProvider>')
  return session
}
