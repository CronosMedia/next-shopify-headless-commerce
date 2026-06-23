export function normalizeRomanianPhoneForShopify(phone: unknown): string | null | undefined {
  if (phone === undefined) return undefined
  if (phone === null) return null
  if (typeof phone !== 'string') return undefined

  const trimmedPhone = phone.trim()
  if (!trimmedPhone) return null

  const compactPhone = trimmedPhone.replace(/[\s().-]/g, '')
  const internationalPhone = compactPhone.startsWith('00')
    ? `+${compactPhone.slice(2)}`
    : compactPhone

  if (/^07\d{8}$/.test(internationalPhone)) {
    return `+4${internationalPhone}`
  }

  if (/^40[237]\d{8}$/.test(internationalPhone)) {
    return `+${internationalPhone}`
  }

  return internationalPhone
}
