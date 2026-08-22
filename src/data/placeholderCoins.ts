import { Coin } from '../types'
import { DEFAULT_COIN_ICONS, resolveCoinIcon } from '../utils/coinIcons'

/** Sample deposit addresses so the Add Funds QR step works before real wallets are configured. */
export const PLACEHOLDER_ADDRESSES: Record<string, { address: string; network: string }> = {
  BTC: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'Bitcoin' },
  ETH: { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', network: 'ERC20' },
  USDT: { address: 'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS', network: 'TRC20' },
  BNB: { address: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', network: 'BEP20' },
  SOL: { address: '7EcDhSYGxXyscszYEp35KHN8mmjDNMfbC7zPehQ24521', network: 'Solana' },
  XRP: { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', network: 'Ripple' },
  ADA: { address: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhqqqqqqqq', network: 'Cardano' },
  DOGE: { address: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L', network: 'Dogecoin' },
  DOT: { address: '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg', network: 'Polkadot' },
  AVAX: { address: 'X-avax1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrd2wpc', network: 'Avalanche' },
}

export const FALLBACK_COINS: Coin[] = [
  { _id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 67000, change24h: 1.2, high24h: 68000, low24h: 65000, rank: 1, isActive: true, minDeposit: 10, image: DEFAULT_COIN_ICONS.BTC },
  { _id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3500, change24h: 0.8, high24h: 3600, low24h: 3400, rank: 2, isActive: true, minDeposit: 10, image: DEFAULT_COIN_ICONS.ETH },
  { _id: 'usdt', symbol: 'USDT', name: 'Tether', price: 1, change24h: 0.01, high24h: 1.01, low24h: 0.99, rank: 3, isActive: true, minDeposit: 10, image: DEFAULT_COIN_ICONS.USDT },
  { _id: 'bnb', symbol: 'BNB', name: 'BNB', price: 580, change24h: 0.4, high24h: 590, low24h: 570, rank: 4, isActive: true, minDeposit: 10, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { _id: 'sol', symbol: 'SOL', name: 'Solana', price: 145, change24h: 2.1, high24h: 150, low24h: 140, rank: 5, isActive: true, minDeposit: 10, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { _id: 'xrp', symbol: 'XRP', name: 'XRP', price: 0.54, change24h: -0.3, high24h: 0.56, low24h: 0.52, rank: 6, isActive: true, minDeposit: 10, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { _id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: 0.2, high24h: 0.47, low24h: 0.44, rank: 7, isActive: true, minDeposit: 10 },
  { _id: 'doge', symbol: 'DOGE', name: 'Dogecoin', price: 0.12, change24h: 1.5, high24h: 0.13, low24h: 0.11, rank: 8, isActive: true, minDeposit: 10 },
  { _id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 7.2, change24h: -0.5, high24h: 7.4, low24h: 7.0, rank: 9, isActive: true, minDeposit: 10 },
  { _id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 28, change24h: 0.9, high24h: 29, low24h: 27, rank: 10, isActive: true, minDeposit: 10 },
]

export function withDepositAddress(coin: Coin): Coin {
  const placeholder = PLACEHOLDER_ADDRESSES[coin.symbol.toUpperCase()]
  const configured = coin.address?.trim()
  return {
    ...coin,
    address: configured || placeholder?.address,
    network: coin.network || placeholder?.network,
  }
}

export function mergeCoinCatalog(remote: Coin[]): Coin[] {
  const bySymbol = new Map<string, Coin>()
  for (const coin of FALLBACK_COINS) {
    bySymbol.set(coin.symbol.toUpperCase(), withDepositAddress(coin))
  }
  for (const coin of remote) {
    if (!coin?.symbol) continue
    const key = coin.symbol.toUpperCase()
    const existing = bySymbol.get(key)
    bySymbol.set(
      key,
      withDepositAddress({
        ...existing,
        ...coin,
        symbol: key,
        image: resolveCoinIcon(key, coin.image || existing?.image),
      })
    )
  }
  return [...bySymbol.values()].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
}
