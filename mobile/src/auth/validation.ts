// Field rules for the auth forms. Each validator returns an error message,
// or null when the value is fine.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_MIN = 8

export function validateName(value: string, label: string) {
  const v = value.trim()
  if (!v) return `${label} is required`
  if (v.length < 2) return `${label} is too short`
  if (/\d/.test(v)) return `${label} can't contain numbers`
  return null
}

export function validateEmail(value: string) {
  const v = value.trim()
  if (!v) return 'E-mail is required'
  if (!EMAIL_RE.test(v)) return 'Enter a valid e-mail'
  return null
}

export function validatePassword(value: string) {
  if (!value) return 'Password is required'
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use both letters and numbers'
  return null
}

export function validatePasswordMatch(password: string, confirm: string) {
  if (!confirm) return 'Re-enter your password'
  if (password !== confirm) return "Passwords don't match"
  return null
}

// Egyptian mobile numbers after +20: 10 digits starting with 10, 11, 12 or 15.
// A leading 0 (local format, e.g. 0100 200 7299) is accepted and dropped.
export function normalizePhone(value: string) {
  return value.replace(/\D/g, '').replace(/^0/, '')
}

export function validatePhone(value: string) {
  const digits = normalizePhone(value)
  if (!digits) return 'Phone number is required'
  if (!/^1[0125]\d{8}$/.test(digits)) return 'Enter a valid Egyptian mobile number'
  return null
}
