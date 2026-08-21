import { NavLink } from 'react-router-dom'
import { Home, BarChart3, CandlestickChart, Clock, Wallet } from 'lucide-react'
import clsx from 'clsx'

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/market', label: 'Market', icon: BarChart3 },
  { to: '/trade', label: 'Trade', icon: CandlestickChart },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/asset', label: 'Asset', icon: Wallet },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('h-5 w-5', isActive && 'text-indigo-600 dark:text-indigo-400')} />
                <span>{label}</span>
                {isActive && <span className="h-0.5 w-6 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
