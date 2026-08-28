import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BadgePercent, Lock, Zap } from 'lucide-react'
import LandingHeader from '../components/LandingHeader'
import Footer from '../components/Footer'
import { coinService } from '../services/marketDataService'
import { Coin } from '../types'
import { formatChange, formatPrice } from '../utils/format'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

const STATS = [
  { value: '$2.4T+', label: '24h Trading Volume' },
  { value: '200+', label: 'Countries & Regions' },
  { value: '150M+', label: 'Registered Users' },
  { value: '350+', label: 'Trading Pairs' },
]

const FEATURES = [
  {
    icon: Lock,
    title: 'Secure & Safe',
    body: 'Your funds are protected with industry-leading security measures and insurance coverage.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    body: 'Execute trades in milliseconds with our high-performance matching engine.',
  },
  {
    icon: BadgePercent,
    title: 'Low Fees',
    body: 'Competitive trading fees starting from 0.1% with volume-based discounts.',
  },
]

function formatMarketCap(value?: number) {
  if (!value) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${formatPrice(value)}`
}

function tradingViewSrc(path: string, config: Record<string, unknown>) {
  return `https://www.tradingview-widget.com/embed-widget/${path}/?locale=en#${encodeURIComponent(JSON.stringify(config))}`
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 text-center sm:mb-12">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500 dark:text-gray-400 sm:text-base">{subtitle}</p>
      )}
    </div>
  )
}

export default function Landing() {
  const { theme } = useTheme()
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const colorTheme = theme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    coinService
      .getCoins()
      .then((list) => setCoins(list.slice(0, 10)))
      .catch(() => setCoins([]))
      .finally(() => setLoading(false))
  }, [])

  const overviewSrc = useMemo(
    () =>
      tradingViewSrc('market-overview', {
        colorTheme,
        dateRange: '12M',
        showChart: true,
        isTransparent: false,
        showSymbolLogo: true,
        width: '100%',
        height: 400,
        tabs: [
          {
            title: 'Crypto',
            symbols: [
              { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
              { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
              { s: 'BINANCE:BNBUSDT', d: 'BNB' },
              { s: 'BINANCE:SOLUSDT', d: 'Solana' },
              { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
              { s: 'BINANCE:XRPUSDT', d: 'Ripple' },
            ],
          },
          {
            title: 'Stocks',
            symbols: [
              { s: 'NASDAQ:AAPL', d: 'Apple' },
              { s: 'NASDAQ:MSFT', d: 'Microsoft' },
              { s: 'NASDAQ:GOOGL', d: 'Google' },
              { s: 'NASDAQ:AMZN', d: 'Amazon' },
              { s: 'NASDAQ:TSLA', d: 'Tesla' },
              { s: 'NYSE:META', d: 'Meta' },
            ],
          },
          {
            title: 'Forex',
            symbols: [
              { s: 'FX:EURUSD', d: 'EUR/USD' },
              { s: 'FX:GBPUSD', d: 'GBP/USD' },
              { s: 'FX:USDJPY', d: 'USD/JPY' },
              { s: 'FX:USDCHF', d: 'USD/CHF' },
              { s: 'FX:AUDUSD', d: 'AUD/USD' },
              { s: 'FX:USDCAD', d: 'USD/CAD' },
            ],
          },
        ],
      }),
    [colorTheme]
  )

  const miniCharts = useMemo(
    () =>
      [
        { title: 'Bitcoin (BTC)', symbol: 'BINANCE:BTCUSDT' },
        { title: 'Apple (AAPL)', symbol: 'NASDAQ:AAPL' },
        { title: 'EUR/USD', symbol: 'FX:EURUSD' },
      ].map((item) => ({
        ...item,
        src: tradingViewSrc('mini-symbol-overview', {
          symbol: item.symbol,
          width: '100%',
          height: 300,
          dateRange: '12M',
          colorTheme,
          isTransparent: false,
          autosize: true,
        }),
      })),
    [colorTheme]
  )

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased transition-colors dark:bg-gray-950 dark:text-white">
      <LandingHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 pb-16 pt-24 dark:from-gray-950 dark:to-gray-900 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute -right-16 top-24 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live markets · Crypto, forex & stocks
            </div>
            <h1 className="landing-hero-title mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
              Trade Forex & Crypto
            </h1>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl md:text-4xl lg:text-5xl">
              The World&apos;s Leading Exchange
            </h2>
            <p className="mx-auto mb-10 max-w-3xl px-2 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-12 sm:text-lg md:text-xl">
              Buy, sell, and trade cryptocurrencies and forex with confidence. Join millions of traders worldwide.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-center text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition hover:scale-[1.03] hover:from-indigo-500 hover:to-purple-500 sm:w-auto sm:text-lg"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="w-full rounded-lg border-2 border-indigo-600 px-8 py-4 text-center text-base font-bold text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950/40 sm:w-auto sm:text-lg"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-6 border-t border-gray-200/80 pt-10 dark:border-white/10 sm:mt-20 sm:grid-cols-4 sm:gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-1 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 sm:mb-2 sm:text-3xl md:text-4xl">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="markets" className="bg-white px-4 py-16 dark:bg-gray-950 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="Top Cryptocurrencies" subtitle="Track live prices across the most traded digital assets." />
          <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200/80 shadow-xl shadow-indigo-500/5 dark:border-white/10" style={{ height: 400 }}>
            <iframe title="Market overview" src={overviewSrc} className="h-full w-full border-0" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-indigo-500/5 dark:border-white/10 dark:bg-gray-900">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 sm:px-6">#</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 sm:px-6">Coin</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400 sm:px-6">Price</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400 sm:px-6">24h Change</th>
                  <th className="hidden px-6 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400 md:table-cell">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-white/5">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="h-8 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  coins.map((coin, index) => (
                    <tr
                      key={coin.symbol}
                      className="group border-b border-gray-100 transition hover:bg-indigo-50/50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 sm:px-6">{index + 1}</td>
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          {resolveMediaUrl(coin.image) ? (
                            <img src={resolveMediaUrl(coin.image)} alt={`${coin.name || coin.symbol} logo`} className="h-10 w-10 rounded-full ring-1 ring-black/5 dark:ring-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900">
                              {coin.symbol.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold">{coin.symbol}</div>
                            <div className="hidden text-xs text-gray-500 sm:block">{coin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold sm:px-6">
                        ${formatPrice(coin.price, coin.price < 1 ? 4 : 2)}
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <span
                          className={clsx(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            coin.change24h >= 0
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          )}
                        >
                          {formatChange(coin.change24h)}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                        {formatMarketCap(coin.marketCap)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16 dark:bg-gray-900 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="Live Market Charts" subtitle="Watch crypto, stocks, and forex move in real time." />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {miniCharts.map((chart) => (
              <div
                key={chart.symbol}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-indigo-500/5 dark:border-white/10 dark:bg-gray-950"
              >
                <h3 className="mb-3 text-lg font-semibold">{chart.title}</h3>
                <div className="overflow-hidden rounded-xl" style={{ height: 300 }}>
                  <iframe title={chart.title} src={chart.src} className="h-full w-full border-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-4 py-16 dark:bg-gray-950 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="Why Choose Us" subtitle="Built for serious traders who want speed, security, and better pricing." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-purple-950/30"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 transition group-hover:scale-105">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{item.title}</h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl">
          <h2 className="mb-4 text-3xl font-bold text-white sm:mb-6 sm:text-4xl">Ready to Start Trading?</h2>
          <p className="mb-8 text-lg text-indigo-100 sm:text-xl">Join millions of traders and start your journey today.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-bold text-indigo-600 shadow-2xl transition hover:scale-105 hover:bg-gray-100 sm:text-lg"
          >
            Get Started Now
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
