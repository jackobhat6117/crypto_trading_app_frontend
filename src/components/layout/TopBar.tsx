import { useState } from 'react'
import { Menu, Bell, Headphones } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SideDrawer from './SideDrawer'
import { useTheme } from '../../contexts/ThemeContext'

interface TopBarProps {
  title?: string
  showBack?: boolean
}

export default function TopBar({ title = 'Base', showBack = false }: TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300">
                ←
              </button>
            ) : (
              <button onClick={() => setDrawerOpen(true)} className="text-gray-700 dark:text-gray-200">
                <Menu className="h-6 w-6" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <div className="h-3 w-3 rounded-sm bg-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent">
                {title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              ☀
            </button>
            <button
              onClick={() => navigate('/customer-service')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Headphones className="h-5 w-5" />
            </button>
            <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
