// Static placeholder user data — swap this for a real API call later, e.g.:
//   const res = await fetch('/api/users')
//   const users = await res.json()
//
// type: 'passenger' | 'driver' | 'supervisor'
// status: 'subscribed' | 'unsubscribed' (passengers only; null for others)
// otherId: student / employee ID or other requirement checked before joining
export const USER_TYPES = [
  { value: 'passenger', label: 'Passenger', plural: 'Passengers' },
  { value: 'driver', label: 'Driver', plural: 'Drivers' },
  { value: 'supervisor', label: 'Supervisor', plural: 'Supervisors' },
]

export const USERS = [
  {
    id: 'u1',
    type: 'passenger',
    name: 'Ali Elsawy',
    email: 'ams.sawy@gmail.com',
    phone: '+20 100 200 7299',
    status: 'subscribed',
    otherId: '21-101096',
  },
  {
    id: 'u2',
    type: 'passenger',
    name: 'Salma Maged',
    email: 'Salmamaged19@gmail.com',
    phone: '+20 100 956 8678',
    status: 'unsubscribed',
    otherId: '22-101214',
  },
  {
    id: 'u6',
    type: 'passenger',
    name: 'Omar Khaled',
    email: 'omar.khaled@example.com',
    phone: '+20 101 445 9032',
    status: 'subscribed',
    otherId: '23-100457',
  },
  {
    id: 'u3',
    type: 'driver',
    name: 'Mahmoud Adel',
    email: 'mahmoud.adel@example.com',
    phone: '+20 111 345 2210',
    status: null,
    otherId: 'DL-558213',
  },
  {
    id: 'u5',
    type: 'driver',
    name: 'Nayef Al-Hilali',
    email: 'nayef.alhilali@example.com',
    phone: '+20 109 771 3054',
    status: null,
    otherId: 'DL-602177',
  },
  {
    id: 'u4',
    type: 'supervisor',
    name: 'Nour Hassan',
    email: 'nour.hassan@example.com',
    phone: '+20 122 908 4415',
    status: null,
    otherId: 'EMP-0412',
  },
]
