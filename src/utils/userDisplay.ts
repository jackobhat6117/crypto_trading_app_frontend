import { User } from '../types'

export function displayUsername(user?: User | null) {
  if (!user) return 'User'
  if (user.username) return user.username
  if (user.email) return user.email.split('@')[0]
  return user.name || 'User'
}

export function displayInitial(user?: User | null) {
  return displayUsername(user).charAt(0).toUpperCase()
}

/** Live site uses a 9-digit account id. Fall back to a stable numeric id when uniqueId is missing. */
export function displayUserId(user?: User | null) {
  if (!user) return '—'
  if (user.uniqueId) return user.uniqueId
  const seed = user._id || user.id || user.email || ''
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return String(100000000 + (hash % 900000000))
}

export function isUserVerified(user?: User | null) {
  const kyc = String(user?.kycStatus || '').toLowerCase()
  return Boolean(user?.isVerified || user?.emailVerified || kyc === 'approved')
}
