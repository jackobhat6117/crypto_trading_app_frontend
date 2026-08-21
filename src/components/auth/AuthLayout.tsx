import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-gray-600 dark:text-gray-300"
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
      <div className="mx-auto max-w-md px-4 pb-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <div className="h-3 w-3 rounded-sm bg-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Base
          </span>
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mb-8 text-gray-500">{subtitle}</p>}

        {children}

        {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </div>
  )
}
