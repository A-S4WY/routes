import { useSyncExternalStore } from 'react'
import { USERS } from './users.js'
import { VEHICLES } from './vehicles.js'
import { ROUTE_PLANS } from './routePlans.js'
import { QR_CODES } from './qrCodes.js'
import { TRIPS } from './trips.js'

// Tiny in-memory store shared by every dashboard page, so a driver added on
// the Users page can be picked in Route Setup, a route created there shows up
// in Route Management, etc. Data lives until the page is reloaded.
// TODO: replace each collection with API calls once the backend exists.
function createCollection(initial) {
  let items = initial
  const listeners = new Set()
  return {
    get: () => items,
    set(next) {
      items = typeof next === 'function' ? next(items) : next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const usersStore = createCollection(USERS)
export const vehiclesStore = createCollection(VEHICLES)
export const routesStore = createCollection(ROUTE_PLANS)
export const qrStore = createCollection(QR_CODES)
export const tripsStore = createCollection(TRIPS)

// Drop-in replacement for useState over a shared collection:
//   const [users, setUsers] = useCollection(usersStore)
export function useCollection(store) {
  const items = useSyncExternalStore(store.subscribe, store.get)
  return [items, store.set]
}
