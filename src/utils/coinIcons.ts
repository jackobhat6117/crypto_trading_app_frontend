/** Default icons for major coins until an admin uploads a custom image. */
export const DEFAULT_COIN_ICONS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
}

export function resolveCoinIcon(symbol?: string, image?: string | null): string | undefined {
  const custom = image?.trim()
  if (custom) return custom
  if (!symbol) return undefined
  return DEFAULT_COIN_ICONS[symbol.toUpperCase()]
}
