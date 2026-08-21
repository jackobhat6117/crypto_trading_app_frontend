import { useEffect, useState } from 'react'

const FUNDING_INTERVAL_HOURS = 8

/** Perpetual funding settles every 8 hours at 00:00, 08:00 and 16:00 UTC. */
function timeUntilNextSettlement(): string {
  const now = new Date()
  const next = new Date(now)
  const nextHour = (Math.floor(now.getUTCHours() / FUNDING_INTERVAL_HOURS) + 1) * FUNDING_INTERVAL_HOURS
  next.setUTCHours(nextHour, 0, 0, 0)

  const remaining = Math.max(0, next.getTime() - now.getTime())
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  const seconds = Math.floor((remaining % 60_000) / 1000)
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
}

interface FundingRateProps {
  rate?: number
  compact?: boolean
}

export default function FundingRate({ rate = 0.00229, compact = false }: FundingRateProps) {
  const [countdown, setCountdown] = useState(timeUntilNextSettlement)

  useEffect(() => {
    const interval = setInterval(() => setCountdown(timeUntilNextSettlement()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (compact) {
    return (
      <span className="text-xs text-gray-700 dark:text-gray-300">
        <span className={rate >= 0 ? 'text-green-500' : 'text-red-500'}>{rate.toFixed(5)}%</span>
        <span className="text-gray-400"> / </span>
        <span className="tabular-nums">{countdown}</span>
      </span>
    )
  }

  return (
    <div className="text-right">
      <p className="text-xs text-gray-500">Funding (8h) / Countdown</p>
      <p className="text-sm font-medium">
        <span className={rate >= 0 ? 'text-green-500' : 'text-red-500'}>{rate.toFixed(5)}%</span>
        <span className="text-gray-400"> / </span>
        <span className="tabular-nums">{countdown}</span>
      </p>
    </div>
  )
}
