import { useEffect, useId, useRef, useState } from 'react'
import { AssetType } from '../../types'
import { useTheme } from '../../contexts/ThemeContext'

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => unknown
    }
  }
}

const INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1d', value: 'D' },
] as const

const METAL_SYMBOLS: Record<string, string> = {
  XAU: 'OANDA:XAUUSD',
  XAG: 'OANDA:XAGUSD',
  XPT: 'OANDA:XPTUSD',
  XPD: 'OANDA:XPDUSD',
  XCU: 'COMEX:HG1!',
  XAL: 'COMEX:ALI1!',
  XZN: 'LME:ZN',
  XNI: 'LME:NI',
  XPB: 'LME:PB',
  XTN: 'LME:SN',
}

function toTradingViewSymbol(type: AssetType, symbol: string) {
  const ticker = symbol.replace('/', '').replace(/USDT$/i, '').toUpperCase()
  if (type === 'forex') return `FX:${ticker}`
  if (type === 'stocks') return ticker
  if (type === 'metals') return METAL_SYMBOLS[ticker] || `TVC:${ticker}`
  if (ticker === 'USDT') return 'BINANCE:USDCUSDT'
  return `BINANCE:${ticker}USDT`
}

function loadTradingViewScript() {
  if (window.TradingView) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>('script[data-tv-widget="true"]')
  if (existing) {
    return new Promise<void>((resolve) => {
      if (window.TradingView) resolve()
      else existing.addEventListener('load', () => resolve(), { once: true })
    })
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.dataset.tvWidget = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load TradingView'))
    document.head.appendChild(script)
  })
}

export default function TradingViewChart({
  symbol,
  type,
}: {
  symbol: string
  type: AssetType
}) {
  const { theme } = useTheme()
  const reactId = useId().replace(/:/g, '')
  const containerId = `tv_chart_${reactId}`
  const hostRef = useRef<HTMLDivElement>(null)
  const [interval, setIntervalValue] = useState<(typeof INTERVALS)[number]['value']>('15')
  const tvSymbol = toTradingViewSymbol(type, symbol)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    host.innerHTML = ''
    const mount = document.createElement('div')
    mount.id = containerId
    mount.style.height = '100%'
    mount.style.width = '100%'
    host.appendChild(mount)

    void loadTradingViewScript()
      .then(() => {
        if (cancelled || !window.TradingView) return
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC',
          theme: theme === 'light' ? 'light' : 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'light' ? '#ffffff' : '#1e222d',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: true,
          withdateranges: true,
          studies: ['STD;RSI', 'Volume@tv-basicstudies'],
          container_id: containerId,
        })
      })
      .catch(() => {
        if (host) {
          host.innerHTML =
            '<p class="flex h-full items-center justify-center text-sm text-gray-500">Unable to load TradingView chart</p>'
        }
      })

    return () => {
      cancelled = true
      host.innerHTML = ''
    }
  }, [containerId, interval, theme, tvSymbol])

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#131722]">
      <div className="flex gap-1 overflow-x-auto px-3 pt-3">
        {INTERVALS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setIntervalValue(item.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              interval === item.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="h-[420px] w-full sm:h-[520px]" ref={hostRef} />
    </div>
  )
}
