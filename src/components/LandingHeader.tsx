import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import BrandLogo from './BrandLogo'
import clsx from 'clsx'

const NAV_LINKS = [
  { href: '#markets', label: 'Markets' },
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
]

export default function LandingHeader() {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={clsx(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-gray-200/70 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-gray-950/80'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <BrandLogo />

          <div className="hidden items-center space-x-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>
            <Link
              to="/signin"
              className="hidden px-3 py-2 text-sm font-medium text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 sm:inline sm:px-4"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-purple-500 sm:px-5 sm:text-sm"
            >
              Get Started
            </Link>
            <button
              className="p-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 md:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-gray-950/95">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/signin"
            onClick={() => setMenuOpen(false)}
            className="mt-1 block py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 sm:hidden"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  )
}
