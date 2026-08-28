export interface PasswordChecks {
  minLength: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function isStrongPassword(password: string): boolean {
  return Object.values(getPasswordChecks(password)).every(Boolean)
}

export function getPasswordValidationError(password: string): string | null {
  const checks = getPasswordChecks(password)
  if (!checks.minLength) return 'Password must be at least 8 characters'
  if (!checks.uppercase) return 'Password must include an uppercase letter'
  if (!checks.lowercase) return 'Password must include a lowercase letter'
  if (!checks.number) return 'Password must include a number'
  if (!checks.special) return 'Password must include a special character'
  return null
}
