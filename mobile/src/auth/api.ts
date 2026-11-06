// Auth calls for passengers ("normal users").
//
// There is no backend yet, so these run against an in-memory stand-in with a
// short delay, behaving the way the real API should:
//   - signUp fails with { field: 'email', message: 'E-mail is already in use' }
//     for a registered e-mail (try ams.sawy@gmail.com),
//   - logIn fails for a wrong e-mail/password combination.
// TODO: once the backend exists, set EXPO_PUBLIC_API_URL and replace the
// bodies below with fetch() calls — the screens only depend on these types.

export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string // +20XXXXXXXXXX
}

export type SignUpInput = Omit<User, 'id'> & { password: string }

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; field?: keyof SignUpInput; message: string }

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? null

// ---- In-memory stand-in (until the backend exists) --------------------------
type StoredUser = User & { password: string }
const users: StoredUser[] = [
  {
    id: 'u1', firstName: 'Ali', lastName: 'Elsawy', email: 'ams.sawy@gmail.com',
    phone: '+201002007299', password: 'routes123',
  },
]
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const publicUser = ({ password: _password, ...user }: StoredUser): User => user

export async function isEmailTaken(email: string): Promise<boolean> {
  await delay(300)
  return users.some((u) => sameEmail(u.email, email))
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  await delay(700)
  if (users.some((u) => sameEmail(u.email, input.email))) {
    return { ok: false, field: 'email', message: 'E-mail is already in use' }
  }
  if (users.some((u) => u.phone === input.phone)) {
    return { ok: false, field: 'phone', message: 'Phone number is already in use' }
  }
  const user: StoredUser = { ...input, email: input.email.trim(), id: `u${Date.now()}` }
  users.push(user)
  return { ok: true, user: publicUser(user) }
}

export async function logIn(email: string, password: string): Promise<AuthResult> {
  await delay(600)
  const user = users.find((u) => sameEmail(u.email, email))
  if (!user || user.password !== password) {
    return { ok: false, field: 'password', message: 'Incorrect e-mail or password' }
  }
  return { ok: true, user: publicUser(user) }
}
