import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { isIndexablePath, pageSeo, siteOrigin } from '../utils/seo'

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

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }
  tag.href = href
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let tag = document.getElementById(id) as HTMLScriptElement | null
  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify(data)
}

export default function SeoHead() {
  const location = useLocation()
  const settings = useSiteSettings()

  useEffect(() => {
    const site = settings?.site
    const origin = siteOrigin()
    const pathname = location.pathname || '/'
    const indexable = isIndexablePath(pathname)
    const canonical = `${origin}${pathname === '/' ? '/' : pathname}`
    const fallback = pageSeo(pathname, site?.metaTitle, site?.metaDescription)
    const title = fallback.title
    const description = site?.metaDescription && pathname === '/' ? site.metaDescription : fallback.description
    const keywords = site?.metaKeywords || fallback.keywords
    const image = resolveMediaUrl(site?.logo) || `${origin}/base-trade-logo.png`
    const siteName = site?.name || 'Base Option Trading'

    document.title = title
    document.documentElement.lang = 'en'

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: indexable ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow',
    })
    upsertMeta('meta[name="googlebot"]', {
      name: 'googlebot',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    })

    upsertLink('canonical', canonical)

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_US' })

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })

    if (indexable) {
      upsertJsonLd('seo-jsonld', {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: siteName,
            url: origin,
            logo: image,
          },
          {
            '@type': 'WebSite',
            name: siteName,
            url: origin,
            description,
            inLanguage: 'en',
          },
        ],
      })
    }
  }, [location.pathname, settings])

  return null
}
