import { Outlet, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppShell() {
  const { pathname } = useLocation()
  const hideTopBar =
    pathname === '/market' ||
    pathname.startsWith('/trade') ||
    pathname === '/history' ||
    pathname.startsWith('/order')

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-gray-100">
      {!hideTopBar && <TopBar />}
      <main
        className={clsx(
          'w-full pb-nav',
          hideTopBar ? '' : 'mx-auto max-w-7xl px-3 pt-2 sm:px-4 lg:px-6'
        )}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
