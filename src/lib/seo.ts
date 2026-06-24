import type {Metadata} from 'next'

export const SITE_NAME = 'Maison Outdoor'
export const SITE_DESCRIPTION =
  'Maison Outdoor - Echipament tehnic și îmbrăcăminte premium pentru expediții și drumeții.'

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | {[key: string]: JsonLdValue}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  return (configuredUrl || 'https://maisonoutdoor.ro').replace(/\/+$/, '')
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}

export function safeJsonLd(data: JsonLdValue) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function defaultMetadata(
  title: string,
  description = SITE_DESCRIPTION,
  path = '/'
): Metadata {
  const url = absoluteUrl(path)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'ro_RO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function breadcrumbJsonLd(items: Array<{name: string; path: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function itemListJsonLd(
  items: Array<{name: string; path: string}>,
  pageType: 'ItemList' | 'CollectionPage' = 'ItemList'
): JsonLdValue {
  const list = {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
    })),
  }

  if (pageType === 'CollectionPage') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      mainEntity: list,
    }
  }

  return {
    '@context': 'https://schema.org',
    ...list,
  }
}
