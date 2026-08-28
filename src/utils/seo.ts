const DEFAULT_TITLE = 'Base Option Trading | Crypto, Forex & Stock Options'
const DEFAULT_DESCRIPTION =
  'Trade cryptocurrency, forex, metals and stocks with Base Option Trading. Fast execution, secure accounts, and live market prices.'
const DEFAULT_KEYWORDS =
  'crypto trading, forex trading, bitcoin, ethereum, options trading, online trading platform, USDT, Base Option Trading'

const PRIVATE_PREFIXES = [
  '/admin',
  '/dashboard',
  '/market',
  '/crypto',
  '/stocks',
  '/forex',
  '/metals',
  '/trade',
  '/history',
  '/asset',
  '/profile',
  '/withdrawal',
  '/customer-service',
  '/order',
  '/settings',
  '/kyc',
  '/confirm-email',
  '/reset-password',
  '/forgot-password',
  '/subadmin',
]

const PAGE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/signin': {
    title: 'Sign In | Base Option Trading',
    description: 'Sign in to your Base Option Trading account to trade crypto, forex, metals and stocks.',
  },
  '/signup': {
    title: 'Create Account | Base Option Trading',
    description: 'Open a Base Option Trading account and start trading cryptocurrency, forex and stocks.',
  },
  '/help-support': {
    title: 'Help & Support | Base Option Trading',
    description: 'Find answers about deposits, withdrawals, KYC, security and trading on Base Option Trading.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Base Option Trading',
    description: 'Read how Base Option Trading collects, uses and protects your personal information.',
  },
}

export function siteOrigin() {
  const configured = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  if (configured && !configured.includes('onrender.com')) return configured
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin
  return 'https://crypto-trading-app-frontend.vercel.app'
}

export function isIndexablePath(pathname: string) {
  return !PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function pageSeo(pathname: string, fallbackTitle?: string, fallbackDescription?: string) {
  const exact = PAGE_SEO[pathname]
  return {
    title: exact?.title || fallbackTitle || DEFAULT_TITLE,
    description: exact?.description || fallbackDescription || DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
  }
}

export { DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS }
