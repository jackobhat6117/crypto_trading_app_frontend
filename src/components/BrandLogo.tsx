import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { resolveMediaUrl } from '../utils/mediaUrl'

const FALLBACK_LOGO = 'https://api.basetradedex.com/uploads/site/logo-1783088481108-478478210.png'

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  to?: string
}

export default function BrandLogo({ size = 'md', to = '/' }: BrandLogoProps) {
  const settings = useSiteSettings()
  const [broken, setBroken] = useState(false)
  const logoSrc = resolveMediaUrl(settings?.site.logo) || FALLBACK_LOGO
  const name = settings?.site.name || 'Base'
  const mark =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-8 w-8 sm:h-10 sm:w-10'
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'

  return (
    <Link to={to} className="flex items-center space-x-2 sm:space-x-3">
      {!broken ? (
        <img
          src={logoSrc}
          alt={name}
          className={`${mark} rounded-xl object-contain shadow-lg shadow-indigo-500/20`}
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className={`${mark} flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30`}
        >
          <span className="text-sm font-bold text-white sm:text-base">B</span>
        </div>
      )}
      <span className={`${text} bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text font-bold tracking-tight text-transparent`}>
        {name.split(' ')[0] || 'Base'}
      </span>
    </Link>
  )
}
