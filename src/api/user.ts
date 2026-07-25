import {BACKEND_HOST, BACKEND_PORT, BACKEND_API_VERSION, BACKEND_API_URL, SKIP_BACKEND} from './defs.ts'

class PassengerInfo {
  constructor(email: string, firstName: string = 'N/A', lastName: string = 'N/A', phoneNumber: string = '0123456789') {
    this.firstName = firstName
    this.lastName = lastName
    this.email = email
    this.phoneNumber = phoneNumber
  }
  
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

export async function passengerSignup(username: string, password: string, passengerInfo: PassengerInfo) {
  if (BACKEND_HOST === '' || BACKEND_PORT === '' || BACKEND_API_VERSION === '') {
    console.log('No Backend API URL provided. Please set the BACKEND_HOST, BACKEND_PORT, and BACKEND_API_VERSION environment variables.')
    return SKIP_BACKEND
  }

  passengerInfo = new PassengerInfo(passengerInfo.email)
  const response = await fetch(`${BACKEND_API_URL}/user/register-passenger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      username: username,
      password: password,
      ...passengerInfo
    }),
  })
  return response
}