export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatMoney(
  amount: string | number,
  currencyCode = 'RON'
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numericAmount)) {
    return '0.00'
  }

  const locale = currencyCode.toUpperCase() === 'RON' ? 'ro-RO' : 'en-GB'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}
