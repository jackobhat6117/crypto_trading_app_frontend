export function formatPrice(value: number, decimals = 2): string {
  if (value === 0 || !value) return '0.00'
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }
  if (value < 0.01) return value.toFixed(6)
  return value.toFixed(decimals)
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatBalance(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function maskValue(hidden: boolean, value: string): string {
  return hidden ? '******' : value
}
