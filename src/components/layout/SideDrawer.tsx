import { useNavigate } from 'react-router-dom'
import {
  User,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  Settings,
  BarChart3,
  Globe,
  Headphones,
  LogOut,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useState } from 'react'
import clsx from 'clsx'
import LanguageModal, { getStoredLanguage } from './LanguageModal'
import { LANGUAGES } from '../../services/authService'

interface SideDrawerProps {
  open: boolean
  onClose: () => void
}

export default function SideDrawer({ open, onClose }: SideDrawerProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const activeLanguage = LANGUAGES.find((l) => l.code === getStoredLanguage()) ?? LANGUAGES[0]

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = async () => {
    await logout()
    onClose()
    navigate('/signin')
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl dark:bg-gray-900 md:hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
              {(user?.name || user?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.name || user?.username || 'User'}
                </p>
                {user?.isVerified && (
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] text-white">Verified</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400">ID: {user?.uniqueId || user?._id?.slice(-9)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {[
            { icon: User, label: 'Personal Info', path: '/profile' },
            { icon: PlusCircle, label: 'Deposits', path: '/profile/deposits' },
            { icon: MinusCircle, label: 'Withdrawals', path: '/profile/withdrawals' },
            { icon: ArrowLeftRight, label: 'Transfers', path: '/profile/transfers' },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => go(path)}
              className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Icon className="h-5 w-5 text-indigo-600" />
              {label}
            </button>
          ))}

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-indigo-600" />
              Settings
            </span>
            {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {settingsOpen && (
            <div className="ml-8 space-y-1 pb-2">
              <button onClick={() => go('/settings/change-password')} className="block w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Change Password
              </button>
              <button onClick={() => go('/settings/2fa')} className="block w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Enable 2FA
              </button>
              <button onClick={() => go('/privacy-policy')} className="block w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Privacy Policy
              </button>
              <button onClick={() => go('/help-support')} className="block w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Help & Support
              </button>
            </div>
          )}

          <button
            onClick={() => go('/trade')}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Futures
          </button>
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            onClick={() => setLanguageOpen(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Globe className="h-5 w-5" />
            <span className="flex-1 text-left">Language</span>
            <span className="text-xs text-gray-500">
              {activeLanguage.flag} {activeLanguage.name}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
          <button
            onClick={() => go('/customer-service')}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Headphones className="h-5 w-5" />
            Customer Service
          </button>
          <button
            onClick={handleLogout}
            className={clsx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      {languageOpen && <LanguageModal onClose={() => setLanguageOpen(false)} />}
    </>
  )
}
