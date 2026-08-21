import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const COLUMNS = [
  {
    title: 'Products',
    links: [
      { label: 'Spot Trading', to: '/signup' },
      { label: 'Futures', to: '/signup' },
      { label: 'Forex', to: '/signup' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#features' },
      { label: 'Blog', href: '#markets' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help-support' },
      { label: 'Contact Us', to: '/help-support' },
      { label: 'API', href: '#features' },
    ],
  },
]

export default function Footer() {
  return (
    <footer id="about" className="border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              The world&apos;s leading cryptocurrency and forex exchange.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 font-bold text-gray-900 dark:text-white">{column.title}</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link && link.to ? (
                      <Link to={link.to} className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-sm text-gray-500">© 2024 Base. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
