import {BACKEND_HOST, BACKEND_PORT, BACKEND_API_VERSION, BACKEND_API_URL, SKIP_BACKEND} from './defs.ts'

export async function passengerLogin(username: string, password: string) {
  if (BACKEND_HOST === '' || BACKEND_PORT === '' || BACKEND_API_VERSION === '') {
    console.log('No Backend API URL provided. Please set the BACKEND_HOST, BACKEND_PORT, and BACKEND_API_VERSION environment variables.')
    return SKIP_BACKEND
  }

  const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      password: password
    }),
  })
  return response
}