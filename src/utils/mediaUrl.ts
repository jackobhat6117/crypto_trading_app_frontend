const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://cryptoapp-api.onrender.com'

export function resolveMediaUrl(path?: string): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
