import { useState } from 'react'
import { Menu, Headphones, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SideDrawer from './SideDrawer'
import NotificationBell from './NotificationBell'
import { useTheme } from '../../contexts/ThemeContext'

interface TopBarProps {
  title?: string
  showBack?: boolean
}

const iconBtn =
  'rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 sm:p-2'

export default function TopBar({ title = 'Base', showBack = false }: TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80">
        <div className="flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:gap-3">
            {showBack ? (
              <button onClick={() => navigate(-1)} className={iconBtn} aria-label="Go back">
                ←
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className={iconBtn}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 sm:h-9 sm:w-9">
                <div className="h-3 w-3 rounded-sm bg-white sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="truncate bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                {title}
              </span>
            </div>
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              onClick={toggleTheme}
              className={iconBtn}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <button
              onClick={() => navigate('/customer-service')}
              className={iconBtn}
              aria-label="Customer Service"
            >
              <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
