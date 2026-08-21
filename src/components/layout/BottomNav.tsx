import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { APP_NAV_ITEMS } from './navItems'

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/95">
      <div className="flex w-full items-center justify-around px-2 py-1.5 sm:px-4 sm:py-2 md:px-8 md:py-2.5">
        {APP_NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition sm:gap-1',
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <Icon className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              <span className="text-[10px] font-medium sm:text-xs md:text-sm">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
