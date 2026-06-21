import roAddresses from "@/data/ro-addresses.json"

export const RO_COUNTIES = roAddresses.counties as string[]

const RO_LOCALITIES_BY_COUNTY = roAddresses.localitiesByCounty as Record<
  string,
  Array<{ name: string; postalCode: string }>
>

export const POSTAL_CODE_REGEX_RO = /^[0-9]{6}$/

export const normalizeRomanianText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s")
    .replace(/Ș/g, "S")
    .replace(/ț/g, "t")
    .replace(/Ț/g, "T")
    .toUpperCase()

export const toDisplayCase = (value: string) =>
  value
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part.trim() || part === "-") return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join("")

export const getCanonicalCounty = (value: string) => {
  const normalized = normalizeRomanianText(value)
  return RO_COUNTIES.find((county) => normalizeRomanianText(county) === normalized) || value
}

export const resolveCountyInput = (value: string) => {
  const normalized = normalizeRomanianText(value.trim())
  return RO_COUNTIES.find((county) => normalizeRomanianText(county) === normalized) || value
}

export const getLocalitiesForCounty = (county: string) => {
  const canonicalCounty = getCanonicalCounty(county)
  return RO_LOCALITIES_BY_COUNTY[canonicalCounty] || []
}

export const getCanonicalLocality = (county: string, locality: string) => {
  const normalizedLocality = normalizeRomanianText(locality.trim())
  return (
    getLocalitiesForCounty(county).find(
      (item) => normalizeRomanianText(item.name) === normalizedLocality
    )?.name || locality
  )
}

export const getPostalCodeForCountyAndLocality = (county: string, locality: string) => {
  const normalizedLocality = normalizeRomanianText(locality)
  return (
    getLocalitiesForCounty(county).find(
      (item) => normalizeRomanianText(item.name) === normalizedLocality
    )?.postalCode || ""
  )
}

export const scoreSearchMatch = (label: string, query: string) => {
  const normalizedLabel = normalizeRomanianText(label)
  const normalizedQuery = normalizeRomanianText(query.trim())
  if (!normalizedQuery) return 1000
  if (normalizedLabel === normalizedQuery) return 0
  if (normalizedLabel.startsWith(normalizedQuery)) return 1

  const words = normalizedQuery.split(/\s+/).filter(Boolean)
  const matchesAllWords = words.every((word) => normalizedLabel.includes(word))
  if (matchesAllWords) return 2

  if (normalizedLabel.includes(normalizedQuery)) return 3
  return Number.POSITIVE_INFINITY
}

export const filterSearchOptions = (options: string[], query: string) =>
  options
    .map((option) => ({ option, score: scoreSearchMatch(option, query) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score || a.option.localeCompare(b.option, "ro-RO"))
    .slice(0, 12)
    .map((item) => item.option)

const inferBucharestSector = (value: string) => {
  const match = value.match(/sector(?:ul)?\s*([1-6])/i)
  if (!match) return ""
  return `Sector ${match[1]}`
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const resolveLocalityFromCountyAndAddress = (county: string, rawAddress: string) => {
  const localities = getLocalitiesForCounty(county)
  if (!localities.length || !rawAddress.trim()) return ""

  const normalizedAddress = normalizeRomanianText(rawAddress)
  const sortedLocalities = [...localities].sort((a, b) => b.name.length - a.name.length)

  for (const locality of sortedLocalities) {
    const normalizedLocality = normalizeRomanianText(locality.name)
    const localityPattern = new RegExp(`(^|[^A-Z0-9])${escapeRegExp(normalizedLocality)}([^A-Z0-9]|$)`)

    if (localityPattern.test(normalizedAddress)) {
      return locality.name
    }
  }

  return ""
}

export const parseAnafAddress = (rawAddress: string) => {
  const address = rawAddress.trim()
  const normalized = normalizeRomanianText(address)
  const postalCode = address.match(/\b\d{6}\b/)?.[0] || ""

  let province = ""
  if (normalized.includes("BUCURESTI")) {
    province = getCanonicalCounty("Bucuresti")
  } else {
    province = RO_COUNTIES.find((county) => normalized.includes(normalizeRomanianText(county))) || ""
  }

  let city = ""
  if (province === "Bucuresti") {
    city = inferBucharestSector(address)
  } else {
    const localityPatterns = [
      /(?:MUNICIPIUL|MUN\.?)\s+([^,]+)/i,
      /(?:ORASUL|ORAS|ORAȘUL|ORAȘ)\s+([^,]+)/i,
      /(?:COMUNA)\s+([^,]+)/i,
      /(?:SATUL|SAT)\s+([^,]+)/i,
    ]

    for (const pattern of localityPatterns) {
      const match = address.match(pattern)
      if (match?.[1]) {
        city = toDisplayCase(match[1].trim())
        break
      }
    }

    if (!city) {
      const parts = address.split(",").map((item) => item.trim()).filter(Boolean)
      if (parts.length >= 2) {
        city = toDisplayCase(
          parts[1].replace(/^(jud\.?|judetul|municipiul|mun\.?|orasul|oras|comuna|satul|sat)\s+/i, "").trim()
        )
      }
    }
  }

  if (province) {
    const matchedLocality = resolveLocalityFromCountyAndAddress(province, address)
    if (matchedLocality) {
      city = matchedLocality
    } else if (city) {
      city = getCanonicalLocality(province, city)
    }
  }

  const parts = address.split(",").map((item) => item.trim()).filter(Boolean)
  let addressLine = address
  if (parts.length >= 3) {
    addressLine = parts.slice(2).join(", ")
  }

  const finalPostalCode = postalCode || (province && city ? getPostalCodeForCountyAndLocality(province, city) : "")

  return {
    province,
    city,
    postalCode: finalPostalCode,
    addressLine: addressLine || address,
  }
}
