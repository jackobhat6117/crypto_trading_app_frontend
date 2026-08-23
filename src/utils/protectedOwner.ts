export const PROTECTED_OWNER_EMAIL = 'godoflibra@gmail.com'

export const isProtectedOwnerEmail = (email?: string | null) =>
  String(email || '').trim().toLowerCase() === PROTECTED_OWNER_EMAIL
