import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { tradeService } from '../services/tradeService'
import { Trade } from '../types'
import { formatBalance } from '../utils/format'
import { useNavigate } from 'react-router-dom'

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    tradeService
      .getHistory()
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const wins = trades.filter((t) => (t.profit || 0) > 0)
    const losses = trades.filter((t) => (t.profit || 0) < 0)
    const totalPl = trades.reduce((s, t) => s + (t.profit || 0), 0)
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0
    return { totalPl, winRate, wins: wins.length, losses: losses.length }
  }, [trades])

  const filtered = trades.filter((t) => {
    if (query && !t.symbol.toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'win') return (t.profit || 0) > 0
    if (filter === 'loss') return (t.profit || 0) < 0
    return true
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Trade History</h1>
        <p className="text-sm text-gray-500">{trades.length} Trades</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol..."
          className="w-full rounded-xl border py-3 pl-10 pr-4 dark:border-gray-800 dark:bg-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total P/L', value: `${stats.totalPl >= 0 ? '+' : ''}${formatBalance(stats.totalPl)} USDT`, color: stats.totalPl >= 0 ? 'text-green-500' : 'text-red-500' },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}% (${stats.wins}W / ${stats.losses}L)` },
          { label: 'Avg Win', value: '+0.00 USDT', color: 'text-green-500' },
          { label: 'Avg Loss', value: '-0.00 USDT', color: 'text-red-500' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-sm font-semibold ${card.color || ''}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'win', 'loss'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
          >
            {f === 'all' ? 'All' : f === 'win' ? 'Wins' : 'Loss'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-500 dark:border-gray-700">
          No trades yet
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <button
              key={trade._id}
              onClick={() => navigate(`/order/${trade._id}`, { state: { trade } })}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-gray-800 dark:bg-gray-900"
            >
              <div>
                <p className="font-medium">{trade.symbol}</p>
                <p className="text-xs capitalize text-gray-500">{trade.side} · {trade.type}</p>
              </div>
              <div className="text-right">
                <p className={(trade.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {(trade.profit || 0) >= 0 ? '+' : ''}{formatBalance(trade.profit || 0)} USDT
                </p>
                <p className="text-xs text-gray-500">{trade.status}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
