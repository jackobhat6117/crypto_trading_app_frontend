import { Home, BarChart3, CandlestickChart, Clock, Wallet, type LucideIcon } from 'lucide-react'

export interface AppNavItem {
  to: string
  label: string
  icon: LucideIcon
  match: (path: string) => boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: Home,
    match: (path) => path === '/dashboard' || path === '/',
  },
  {
    to: '/market',
    label: 'Market',
    icon: BarChart3,
    match: (path) =>
      path.startsWith('/market') ||
      path.startsWith('/crypto') ||
      path.startsWith('/stocks') ||
      path.startsWith('/forex') ||
      path.startsWith('/metals'),
  },
  {
    to: '/trade',
    label: 'Trade',
    icon: CandlestickChart,
    match: (path) => path.startsWith('/trade'),
  },
  {
    to: '/history',
    label: 'History',
    icon: Clock,
    match: (path) => path.startsWith('/history') || path.startsWith('/order'),
  },
  {
    to: '/asset',
    label: 'Asset',
    icon: Wallet,
    match: (path) => path.startsWith('/asset'),
  },
]
