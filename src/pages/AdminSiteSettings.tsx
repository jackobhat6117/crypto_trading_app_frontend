import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
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
      .then(setSettings)
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
      setNotice(`${kind === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`)
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

  const assets = [
    {
      kind: 'logo' as const,
      label: 'Upload Logo',
      hint: 'Recommended: PNG, SVG, or JPG. Max size: 5MB',
      src: settings.logo,
    },
    {
      kind: 'favicon' as const,
      label: 'Upload Favicon',
      hint: 'Recommended: PNG, ICO, or SVG. Max size: 2MB',
      src: settings.favicon,
    },
  ]

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Site Settings</h1>
      <p className="mb-6 text-sm text-slate-400">Branding and platform-wide configuration</p>

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

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 font-semibold text-white">General</h2>
          {[
            { key: 'siteName' as const, label: 'Site Name' },
            { key: 'supportEmail' as const, label: 'Support Email' },
            { key: 'currency' as const, label: 'Currency' },
          ].map((field) => (
            <div key={field.key} className="mb-3">
              <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
              <input
                value={settings[field.key] ?? ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <label className="mt-2 flex items-center justify-between text-sm text-slate-300">
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
            className="mt-5 w-full rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 font-semibold text-white">Branding Assets</h2>
          {assets.map((asset) => (
            <div key={asset.kind} className="mb-6 last:mb-0">
              <p className="mb-2 text-xs text-slate-400">{asset.label}</p>
              {asset.src && (
                <img
                  src={resolveMediaUrl(asset.src)}
                  alt=""
                  className="mb-2 h-12 rounded bg-white/5 object-contain p-1"
                />
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-4 text-sm text-slate-400 hover:border-white/30">
                <Upload size={15} />
                {uploading === asset.kind ? 'Uploading...' : asset.label}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) upload(asset.kind, file)
                  }}
                />
              </label>
              <p className="mt-1 text-[11px] text-slate-500">{asset.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
