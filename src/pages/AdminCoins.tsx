import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminCoinService } from '../services/adminPanelService'
import { Coin } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'
import StatusBadge from '../components/admin/StatusBadge'

type Draft = Partial<Coin>

const EMPTY: Draft = {
  symbol: '',
  name: '',
  price: 0,
  change24h: 0,
  minDeposit: 10,
  maxDeposit: 0,
  minWithdraw: 10,
  maxWithdraw: 0,
  address: '',
  isActive: true,
}

function CoinForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const fields: { key: keyof Coin; label: string; type: string }[] = [
    { key: 'symbol', label: 'Symbol', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'minDeposit', label: 'Min Deposit (USDT)', type: 'number' },
    { key: 'maxDeposit', label: 'Max Deposit (USDT)', type: 'number' },
    { key: 'minWithdraw', label: 'Min Withdrawal (USDT)', type: 'number' },
    { key: 'maxWithdraw', label: 'Max Withdrawal (USDT)', type: 'number' },
    { key: 'address', label: 'Wallet Address', type: 'text' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          {draft._id ? 'Edit Coin' : 'Create New Coin'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.key} className={field.key === 'address' ? 'col-span-2' : ''}>
              <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
              <input
                type={field.type}
                value={String(draft[field.key] ?? '')}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                  })
                }
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={draft.isActive !== false}
              onChange={(e) => onChange({ ...draft, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : draft._id ? 'Save Changes' : 'Create Coin'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoins() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCoins(await adminCoinService.getAll())
    } catch {
      setError('Failed to fetch coins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (!draft) return
    setSaving(true)
    setError('')
    try {
      if (draft._id) await adminCoinService.update(draft._id, draft)
      else await adminCoinService.create(draft)
      setDraft(null)
      await load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Error saving coin')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (coin: Coin) => {
    if (!window.confirm('Are you sure you want to delete this coin?')) return
    try {
      await adminCoinService.remove(coin._id)
      await load()
    } catch {
      setError('Error deleting coin')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Coins</h1>
          <p className="text-sm text-slate-400">All Coins ({coins.length})</p>
        </div>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} /> Create Coin
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Coin</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Deposit Limits</th>
              <th className="px-5 py-3">Withdrawal Limits</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  Loading coins...
                </td>
              </tr>
            ) : coins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  No coins found
                </td>
              </tr>
            ) : (
              coins.map((coin) => (
                <tr key={coin._id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {coin.image ? (
                        <img src={resolveMediaUrl(coin.image)} alt="" className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-xs text-slate-300">
                          {coin.symbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{coin.symbol}</p>
                        <p className="text-xs text-slate-500">{coin.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300">${coin.price?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-400">
                    {coin.minDeposit ?? 0} – {coin.maxDeposit || '∞'}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {coin.minWithdraw ?? 0} – {coin.maxWithdraw || '∞'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={coin.isActive === false ? 'DISABLED' : 'ACTIVE'} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDraft(coin)}
                        aria-label="Edit coin"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove(coin)}
                        aria-label="Delete coin"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <CoinForm
          draft={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setDraft(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
