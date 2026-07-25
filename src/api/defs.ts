export const SKIP_BACKEND = { code: 200, message: 'Backend API skipped' }
export const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || ''
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || ''
export const BACKEND_API_VERSION = import.meta.env.VITE_BACKEND_API_VERSION || ''
export const BACKEND_API_URL = `${BACKEND_HOST}:${BACKEND_PORT}/api/${BACKEND_API_VERSION}`