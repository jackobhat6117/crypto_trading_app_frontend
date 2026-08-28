import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Crosshair,
  DollarSign,
  Lock,
  Pencil,
  Target,
  UserRound,
  UserRoundCog,
} from 'lucide-react'
import { adminService, AdminUser } from '../services/adminService'
import { adminUserService, WinTradeSlot } from '../services/adminPanelService'
import { sessionManager } from '../services/sessionManager'
import { isProtectedOwnerEmail } from '../utils/protectedOwner'

const TIMERS: { seconds: number; label: string; color: string }[] = [
  { seconds: 30, label: '30 Seconds Timer', color: 'bg-emerald-400' },
  { seconds: 60, label: '60 Seconds Timer', color: 'bg-sky-400' },
  { seconds: 180, label: '3 Minutes Timer', color: 'bg-violet-400' },
  { seconds: 300, label: '5 Minutes Timer', color: 'bg-pink-400' },
  { seconds: 600, label: '10 Minutes Timer', color: 'bg-orange-400' },
]

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-slate-600'}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Card({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string
  icon: typeof UserRound
  tone: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#151b2b] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={16} />
        </span>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function emptyGrid(): WinTradeSlot[] {
  return TIMERS.flatMap((timer) =>
    (['BUY', 'SELL'] as const).map((side) => ({
      timer: timer.seconds,
      side,
      enabled: false,
      percent: 50,
    }))
  )
}

export default function AdminUserEdit() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [info, setInfo] = useState({ email: '', name: '', uniqueId: '', phone: '', isVerified: false })
  const [savingInfo, setSavingInfo] = useState(false)

  const [balanceMode, setBalanceMode] = useState<'add' | 'subtract'>('add')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [logToDeposit, setLogToDeposit] = useState(false)
  const [logToWithdrawal, setLogToWithdrawal] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [savingBalance, setSavingBalance] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [settings, setSettings] = useState({ isActive: true, allowTrade: true, allowWithdraw: true })
  const [savingSettings, setSavingSettings] = useState(false)

  const [notice, setNotice] = useState('')
  const [savingNotice, setSavingNotice] = useState(false)

  const [winTrade, setWinTrade] = useState<WinTradeSlot[]>(emptyGrid())
  const [savingWin, setSavingWin] = useState(false)

  const [logs, setLogs] = useState<Array<{ id: string; type: string; action: string; createdAt: string }>>([])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    window.setTimeout(() => setToast(null), 2800)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profile, configs, userLogs] = await Promise.all([
        adminService.getUserDetail(id),
        adminUserService.getWinTrade(id).catch(() => emptyGrid()),
        adminUserService.getLogs(id).catch(() => []),
      ])
      setUser(profile)
      setInfo({
        email: profile.email || '',
        name: profile.name || '',
        uniqueId: profile.uniqueId || '',
        phone: profile.phone || '',
        isVerified: Boolean(profile.isVerified),
      })
      setSettings({
        isActive: profile.isActive !== false,
        allowTrade: profile.allowTrade !== false,
        allowWithdraw: profile.allowWithdraw !== false,
      })
      setNotice(profile.noticeMessage || '')
      setWinTrade(configs.length > 0 ? configs : emptyGrid())
      setLogs(Array.isArray(userLogs) ? userLogs.slice(0, 20) : [])
    } catch {
      showToast('Failed to load user', false)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (loading || window.location.hash !== '#logs') return
    document.getElementById('user-logs')?.scrollIntoView({ behavior: 'smooth' })
  }, [loading])

  const usdtBalance = useMemo(() => {
    return user?.wallets?.find((w) => w.asset === 'USDT')?.balance ?? 0
  }, [user])

  const slotFor = (timer: number, side: 'BUY' | 'SELL') =>
    winTrade.find((item) => item.timer === timer && item.side === side) || {
      timer,
      side,
      enabled: false,
      percent: 50,
    }

  const patchSlot = (timer: number, side: 'BUY' | 'SELL', patch: Partial<WinTradeSlot>) => {
    setWinTrade((current) => {
      const exists = current.some((item) => item.timer === timer && item.side === side)
      const next = exists
        ? current.map((item) =>
            item.timer === timer && item.side === side ? { ...item, ...patch } : item
          )
        : [...current, { timer, side, enabled: false, percent: 50, ...patch }]
      return next
    })
  }

  const saveInfo = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    setSavingInfo(true)
    try {
      await adminUserService.updateProfile(id, info)
      showToast('User information saved')
      await load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message || 'Failed to save user info', false)
    } finally {
      setSavingInfo(false)
    }
  }

  const saveBalance = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    const amount = Number(balanceAmount)
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', false)
      return
    }
    setSavingBalance(true)
    try {
      await adminUserService.adjustBalance(id, amount, balanceMode, undefined, {
        logToDeposit,
        logToWithdrawal,
        notifyEmail,
      })
      setBalanceAmount('')
      showToast(balanceMode === 'add' ? 'Balance added' : 'Balance subtracted')
      await load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message || 'Balance update failed', false)
    } finally {
      setSavingBalance(false)
    }
  }

  const savePassword = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    if (!newPassword.trim()) {
      showToast('Password is required', false)
      return
    }
    setSavingPassword(true)
    try {
      await adminUserService.resetPassword(id, newPassword)
      setNewPassword('')
      showToast('Password changed')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message || 'Failed to change password', false)
    } finally {
      setSavingPassword(false)
    }
  }

  const saveSettings = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    setSavingSettings(true)
    try {
      await adminUserService.updateSettings(id, settings)
      showToast('Trading settings saved')
      await load()
    } catch {
      showToast('Failed to save settings', false)
    } finally {
      setSavingSettings(false)
    }
  }

  const saveNotice = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    setSavingNotice(true)
    try {
      await adminUserService.updateSettings(id, { noticeMessage: notice })
      showToast('Notice saved')
    } catch {
      showToast('Failed to save notice', false)
    } finally {
      setSavingNotice(false)
    }
  }

  const saveWin = async () => {
    if (isProtectedOwnerEmail(user?.email)) return
    setSavingWin(true)
    try {
      await adminUserService.saveWinTrade(id, winTrade)
      showToast('Win trade settings saved')
    } catch {
      showToast('Failed to save win trade settings', false)
    } finally {
      setSavingWin(false)
    }
  }

  const loginAs = async () => {
    try {
      const result = await adminUserService.loginAs(id)
      if (!result?.token) throw new Error('Login-as failed')
      sessionManager.saveSession({
        accessToken: result.token,
        expiresAt: null,
        user: {
          _id: result.user?.id || id,
          email: result.user?.email || user?.email || '',
          name: result.user?.name || user?.name,
          role: 'user',
        },
      })
      window.location.assign('/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message || 'Login as user failed', false)
    }
  }

  const locked = isProtectedOwnerEmail(user?.email)

  const fieldClass =
    'mt-1 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60'
  const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500'

  if (loading && !user) {
    return <div className="p-8 text-sm text-slate-500">Loading user…</div>
  }

  return (
    <div className="min-h-screen">
      {toast && (
        <div
          className={`fixed right-6 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-xl ${
            toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-indigo-600 px-6 py-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="mb-2 flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/80">{user?.email}</p>
      </div>

      {locked && (
        <div className="mx-6 mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This owner super admin account is locked. It cannot be edited or deleted.
        </div>
      )}

      <div className="grid gap-5 p-6 lg:grid-cols-2">
        <Card title="User Information" icon={UserRound} tone="bg-indigo-500/20 text-indigo-300">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Email</label>
              <input className={fieldClass} value={info.email} disabled={locked} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={fieldClass} value={info.name} disabled={locked} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Unique ID</label>
              <input className={fieldClass} value={info.uniqueId} disabled={locked} onChange={(e) => setInfo({ ...info, uniqueId: e.target.value })} />
              <p className="mt-1 text-xs text-slate-500">Unique identifier for this user.</p>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={fieldClass} value={info.phone} disabled={locked} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Balance</label>
              <p className="mt-1 text-2xl font-bold text-sky-400">{money(usdtBalance)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
              <span className="text-sm text-slate-300">Email Verified</span>
              <Toggle checked={info.isVerified} onChange={(value) => setInfo({ ...info, isVerified: value })} />
            </div>
            <button
              onClick={saveInfo}
              disabled={savingInfo || locked}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingInfo ? 'Saving…' : 'Save User Info'}
            </button>
          </div>
        </Card>

        <Card title="Balance Management" icon={DollarSign} tone="bg-emerald-500/20 text-emerald-300">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setBalanceMode('add')}
              className={`rounded-lg py-2.5 text-sm font-semibold ${
                balanceMode === 'add' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400'
              }`}
            >
              Add Balance
            </button>
            <button
              onClick={() => setBalanceMode('subtract')}
              className={`rounded-lg py-2.5 text-sm font-semibold ${
                balanceMode === 'subtract' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-400'
              }`}
            >
              Subtract Balance
            </button>
          </div>
          <label className={labelClass}>Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            placeholder="Enter amount"
            className={fieldClass}
          />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              Log to Deposit
              <Toggle checked={logToDeposit} onChange={setLogToDeposit} />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              Log to Withdrawal
              <Toggle checked={logToWithdrawal} onChange={setLogToWithdrawal} />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              Notify via Email
              <Toggle checked={notifyEmail} onChange={setNotifyEmail} />
            </div>
          </div>
          <button
            onClick={saveBalance}
              disabled={savingBalance || locked}
            className={`mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              balanceMode === 'add' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {savingBalance ? 'Saving…' : balanceMode === 'add' ? 'Add Balance' : 'Subtract Balance'}
          </button>
        </Card>

        <Card title="Trading Settings" icon={Target} tone="bg-violet-500/20 text-violet-300">
          <div className="space-y-4">
            {[
              { key: 'isActive' as const, label: 'Active User', hint: 'Enable or disable user account' },
              { key: 'allowTrade' as const, label: 'Allow Trade', hint: 'Permit user to place trades' },
              { key: 'allowWithdraw' as const, label: 'Allow Withdraw', hint: 'Permit user to withdraw funds' },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
                <div>
                  <p className="text-sm text-white">{row.label}</p>
                  <p className="text-xs text-slate-500">{row.hint}</p>
                </div>
                <Toggle checked={settings[row.key]} onChange={(value) => setSettings({ ...settings, [row.key]: value })} />
              </div>
            ))}
            <button
              onClick={saveSettings}
              disabled={savingSettings || locked}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingSettings ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Change Password" icon={Lock} tone="bg-amber-500/20 text-amber-300">
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={fieldClass}
            />
            <button
              onClick={savePassword}
              disabled={savingPassword || locked}
              className="mt-4 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingPassword ? 'Saving…' : 'Change Password'}
            </button>
          </Card>

          <Card title="App Notice Message" icon={Pencil} tone="bg-sky-500/20 text-sky-300">
            <label className={labelClass}>Notice Message</label>
            <textarea
              rows={4}
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="Enter notice message for user"
              className={fieldClass}
            />
            <button
              onClick={saveNotice}
              disabled={savingNotice || locked}
              className="mt-4 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingNotice ? 'Saving…' : 'Save Notice'}
            </button>
          </Card>
        </div>
      </div>

      <div className="px-6 pb-6">
        <section className="rounded-xl border border-white/10 bg-[#151b2b] p-5">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <Crosshair size={16} />
            </span>
            <div>
              <h2 className="font-semibold text-white">Win Trade Configuration</h2>
              <p className="text-xs text-slate-500">
                Toggle on to force a win, off to force a loss. The percent is applied to the user&apos;s
                trade amount (50% of $100 = $50) when that timer finishes.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {TIMERS.map((timer) => (
              <div key={timer.seconds} className="rounded-xl border border-white/10 bg-[#0d1117] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${timer.color}`} />
                  <h3 className="text-sm font-semibold text-white">{timer.label}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(['BUY', 'SELL'] as const).map((side) => {
                    const slot = slotFor(timer.seconds, side)
                    return (
                      <div key={side} className="rounded-lg border border-white/5 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            {side === 'BUY' ? 'Buy/Long' : 'Sell/Short'}
                          </p>
                          <Toggle
                            checked={slot.enabled}
                            onChange={(value) => patchSlot(timer.seconds, side, { enabled: value })}
                          />
                        </div>
                        <label className={labelClass}>{slot.enabled ? 'Win %' : 'Loss %'}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={slot.percent}
                          onChange={(e) =>
                            patchSlot(timer.seconds, side, { percent: Number(e.target.value) || 0 })
                          }
                          className={fieldClass}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveWin}
              disabled={savingWin || locked}
            className="mt-5 w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingWin ? 'Saving…' : 'Save Win Trade Settings'}
          </button>
          <button
            onClick={loginAs}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white"
          >
            <UserRoundCog size={16} /> Login As User
          </button>
        </section>

        <section id="user-logs" className="mt-5 rounded-xl border border-white/10 bg-[#151b2b] p-5">
          <h2 className="mb-3 font-semibold text-white">Logs</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
                  <span className="text-slate-300">
                    {log.type} · {log.action}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
