import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { formatBalance, maskValue } from '../utils/format'
import { coinService } from '../services/marketDataService'
import { useEffect } from 'react'
import { Coin } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'
import AddFundsModal from '../components/AddFundsModal'
import WithdrawFundsModal from '../components/WithdrawFundsModal'

export default function AssetPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(true)
  const [tab, setTab] = useState<'crypto' | 'account'>('crypto')
  const [coins, setCoins] = useState<Coin[]>([])
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  useEffect(() => {
    coinService.getCoins().then(setCoins).catch(() => setCoins([]))
  }, [])

  const balance = user?.balance ?? 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">Est. Total Value</p>
          <button onClick={() => setHidden(!hidden)} className="text-gray-400">
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mb-1 text-3xl font-bold">{maskValue(hidden, `${formatBalance(balance)} USDT`)}</p>
        <p className="mb-4 text-sm text-gray-500">Today&apos;s PNL {maskValue(hidden, '0.00')}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAddFundsOpen(true)}
            className="rounded-xl bg-yellow-500 py-3 font-semibold text-gray-900"
          >
            Add Funds
          </button>
          <button
            onClick={() => setWithdrawOpen(true)}
            className="rounded-xl bg-gray-200 py-3 font-semibold dark:bg-gray-800"
          >
            Send
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['crypto', 'account'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'crypto' ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">U</div>
                <div>
                  <p className="font-medium">USDT</p>
                  <p className="text-xs text-gray-500">Tether</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{maskValue(hidden, formatBalance(balance))}</p>
                <div className="mt-1 flex justify-end gap-2">
                  <button onClick={() => setAddFundsOpen(true)} className="text-xs text-indigo-600">
                    Earn
                  </button>
                  <button onClick={() => navigate('/trade/crypto/USDT')} className="text-xs text-indigo-600">
                    Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
          {coins.filter((c) => c.symbol !== 'USDT').slice(0, 5).map((coin) => (
            <div key={coin._id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {coin.image ? (
                    <img src={resolveMediaUrl(coin.image)} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                      {coin.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{coin.symbol}</p>
                    <p className="text-xs text-gray-500">{coin.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{maskValue(hidden, '0.00')}</p>
                  <p className="text-xs text-gray-500">Today&apos;s PNL: {maskValue(hidden, '0.00')}</p>
                  <p className="text-xs text-gray-500">Average Price: {maskValue(hidden, '0.00')}</p>
                  <div className="mt-1 flex justify-end gap-2">
                    <button onClick={() => setAddFundsOpen(true)} className="text-xs text-indigo-600">
                      Earn
                    </button>
                    <button
                      onClick={() => navigate(`/trade/crypto/${coin.symbol}`)}
                      className="text-xs text-indigo-600"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Account overview
        </div>
      )}
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <WithdrawFundsModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  )
}
