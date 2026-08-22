import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { settingsService } from '../services/marketDataService'
import { SiteSettings } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'

const SiteSettingsContext = createContext<SiteSettings | null>(null)

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    document.head.appendChild(tag)
  }
  for (const [key, value] of Object.entries(attributes)) {
    tag.setAttribute(key, value)
  }
}

function applySeo(settings: SiteSettings | null) {
  const site = settings?.site
  const title = site?.metaTitle || site?.name || 'Base Option Trading'
  const description = site?.metaDescription || ''
  const favicon = resolveMediaUrl(site?.favicon)

  document.title = title

  if (description) {
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
  }
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })

  if (favicon) {
    const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
    if (links.length === 0) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = favicon
      document.head.appendChild(link)
    } else {
      links.forEach((link) => {
        link.href = favicon
      })
    }
  }
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    settingsService
      .getPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    applySeo(settings)
  }, [settings])

  const value = useMemo(() => settings, [settings])

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
