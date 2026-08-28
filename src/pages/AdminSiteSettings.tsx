import { useEffect, useState } from 'react'
import { AdminSiteSettings, siteSettingsService } from '../services/adminPanelService'
import { resolveMediaUrl } from '../utils/mediaUrl'

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    siteSettingsService
      .get()
      .then((data) =>
        setSettings({
          ...data,
          metaTitle: data.metaTitle || data.siteName || 'Base Option Trading',
          metaDescription: data.metaDescription || '',
          metaKeywords: data.metaKeywords || '',
        })
      )
      .catch(() => setError('Failed to load site settings'))
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    try {
      await siteSettingsService.update(settings)
      setNotice('Site settings updated successfully')
    } catch {
      setError('Failed to update site settings')
    } finally {
      setSaving(false)
    }
  }

  const upload = async (kind: 'logo' | 'favicon', file: File) => {
    setUploading(kind)
    setError('')
    try {
      await (kind === 'logo'
        ? siteSettingsService.uploadLogo(file)
        : siteSettingsService.uploadFavicon(file))
      setSettings(await siteSettingsService.get())
      setNotice(`${kind === 'logo' ? 'Site logo' : 'Site favicon'} uploaded successfully`)
    } catch {
      setError(`Failed to upload ${kind}`)
    } finally {
      setUploading('')
    }
  }

  if (!settings) {
    return (
      <div className="p-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Site Settings</h1>
        <p className="text-sm text-slate-500">{error || 'Loading settings...'}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Site Settings</h1>
      <p className="mb-6 text-sm text-slate-400">Logo, favicon, and SEO used on the customer site</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      <div className="max-w-3xl space-y-5">
        <section className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Site Logo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0d1117]">
              {settings.logo ? (
                <img src={resolveMediaUrl(settings.logo)} alt="Site logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xs text-slate-500">No logo</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs text-slate-400">Upload Logo</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void upload('logo', file)
                }}
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {uploading === 'logo' ? 'Uploading…' : 'Recommended: PNG, SVG, or JPG. Max size: 5MB'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Site Favicon</h2>
          <p className="mb-4 text-sm text-slate-400">
            The favicon appears in browser tabs and bookmarks. Recommended: 32x32 or 16x16 PNG, or ICO format.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0d1117]">
              {settings.favicon ? (
                <img src={resolveMediaUrl(settings.favicon)} alt="Favicon" className="h-8 w-8 object-contain" />
              ) : (
                <span className="text-[10px] text-slate-500">None</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs text-slate-400">Upload Favicon</label>
              <input
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void upload('favicon', file)
                }}
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {uploading === 'favicon' ? 'Uploading…' : 'Recommended: PNG, ICO, or SVG. Max size: 2MB'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">SEO Settings</h2>
          <p className="mb-5 text-sm text-slate-400">
            Configure meta tags and Open Graph settings for better search engine visibility and social media sharing.
          </p>

          <label className="mb-1 block text-sm text-slate-300">Meta Title</label>
          <input
            value={settings.metaTitle || ''}
            onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
            placeholder="Base Option Trading"
            className="mb-1 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
          />
          <p className="mb-4 text-[11px] text-slate-500">
            Appears in search engine results (recommended: 50-60 characters)
            {settings.metaTitle ? ` · ${settings.metaTitle.length}` : ''}
          </p>

          <label className="mb-1 block text-sm text-slate-300">Meta Description</label>
          <textarea
            rows={4}
            value={settings.metaDescription || ''}
            onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
            placeholder="A brief description of your platform..."
            className="mb-1 w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
          />
          <p className="mb-5 text-[11px] text-slate-500">
            Appears in search engine results (recommended: 150-160 characters)
            {settings.metaDescription ? ` · ${settings.metaDescription.length}` : ''}
          </p>

          <label className="mb-1 block text-sm text-slate-300">Meta Keywords</label>
          <input
            value={settings.metaKeywords || ''}
            onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
            placeholder="crypto trading, forex, bitcoin, options"
            className="mb-1 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
          />
          <p className="mb-5 text-[11px] text-slate-500">
            Comma-separated terms that help search engines understand the page
          </p>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Site Name</label>
              <input
                value={settings.siteName ?? ''}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Support Email</label>
              <input
                value={settings.supportEmail ?? ''}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <label className="mb-5 flex items-center justify-between text-sm text-slate-300">
            Maintenance mode
            <input
              type="checkbox"
              checked={!!settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
          </label>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save SEO & Site Settings'}
          </button>
        </section>
      </div>
    </div>
  )
}
