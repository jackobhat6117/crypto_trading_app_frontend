import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { settingsService } from '../services/marketDataService'
import { SiteSettings } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'

const SiteSettingsContext = createContext<SiteSettings | null>(null)

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    settingsService
      .getPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    const favicon = resolveMediaUrl(settings?.site?.favicon)
    if (!favicon) return
    const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
    if (links.length === 0) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = favicon
      document.head.appendChild(link)
      return
    }
    links.forEach((link) => {
      link.href = favicon
    })
  }, [settings])

  const value = useMemo(() => settings, [settings])

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
