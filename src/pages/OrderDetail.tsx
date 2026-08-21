import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Trade } from '../types'
import { formatBalance } from '../utils/format'

export default function OrderDetailPage() {
  const { tradeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const trade = (location.state as { trade?: Trade })?.trade

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/history')} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold">Order Details</h1>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Order ID</p>
        <p className="mb-4 font-mono text-sm">{tradeId}</p>
        {trade ? (
          <div className="space-y-3">
            {[
              ['Symbol', trade.symbol],
              ['Side', trade.side],
              ['Type', trade.type],
              ['Amount', `${formatBalance(trade.amount)} USDT`],
              ['Entry Price', trade.entryPrice ? formatBalance(trade.entryPrice) : '—'],
              ['Status', trade.status || 'pending'],
              ['Profit/Loss', trade.profit != null ? `${formatBalance(trade.profit)} USDT` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading order details...</p>
        )}
      </div>
    </div>
  )
}
