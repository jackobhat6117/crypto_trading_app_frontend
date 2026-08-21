import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, ShieldCheck, ShieldOff } from 'lucide-react'
import { authService, TwoFactorSetup } from '../services/authService'
import PageHeader from '../components/layout/PageHeader'

export default function TwoFactorAuth() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    authService
      .getTwoFactorStatus()
      .then((status) => setEnabled(status.enabled))
      .catch(() => setError('Error checking 2FA status'))
      .finally(() => setLoading(false))
  }, [])

  const beginSetup = async () => {
    setError('')
    setBusy(true)
    try {
      setSetup(await authService.setupTwoFactor())
    } catch {
      setError('Failed to setup 2FA')
    } finally {
      setBusy(false)
    }
  }

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await authService.verifyTwoFactor(code)
      setEnabled(true)
      setSetup(null)
      setCode('')
      setNotice('Your account is protected with two-factor authentication')
    } catch {
      setError('Error verifying 2FA')
    } finally {
      setBusy(false)
    }
  }

  const disable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await authService.disableTwoFactor(code)
      setEnabled(false)
      setCode('')
      setNotice('Two-factor authentication has been disabled')
    } catch {
      setError('Failed to disable 2FA')
    } finally {
      setBusy(false)
    }
  }

  const copySecret = async () => {
    if (!setup?.secret) return
    await navigator.clipboard.writeText(setup.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeInput = (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code</label>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] dark:border-gray-700 dark:bg-gray-900"
      />
      <p className="mt-2 text-xs text-gray-500">Enter the 6-digit code from your authenticator app</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Two-Factor Authentication" />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Loading...
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {enabled ? (
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
            ) : (
              <ShieldOff className="h-10 w-10 text-gray-400" />
            )}
            <div>
              <p className="font-semibold">{enabled ? '2FA is enabled' : '2FA is not enabled'}</p>
              <p className="text-sm text-gray-500">
                {enabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Enable 2FA to add an extra layer of security'}
              </p>
            </div>
          </div>

          {enabled ? (
            <form onSubmit={disable} className="mt-5 space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
              {codeInput}
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Disable 2FA'}
              </button>
            </form>
          ) : setup ? (
            <form onSubmit={confirmSetup} className="mt-5 space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Scan QR Code</p>
                <div className="flex justify-center rounded-xl bg-white p-4">
                  <QRCodeSVG value={setup.otpauthUrl || setup.secret} size={180} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Or enter this key manually
                </p>
                <button
                  type="button"
                  onClick={copySecret}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <span className="break-all">{setup.secret}</span>
                  <Copy className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
                {copied && <p className="mt-1 text-xs text-emerald-500">Copied to clipboard</p>}
              </div>
              {codeInput}
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Enable 2FA'}
              </button>
            </form>
          ) : (
            <button
              onClick={beginSetup}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? 'Loading...' : 'Enable 2FA'}
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 font-semibold">What is Two-Factor Authentication?</h2>
        <p className="text-sm text-gray-500">
          Two-factor authentication adds a second step to signing in. Alongside your password you enter a 6-digit
          code generated by an authenticator app such as Google Authenticator or Authy, so an attacker who learns
          your password still cannot reach your account.
        </p>
      </div>
    </div>
  )
}
