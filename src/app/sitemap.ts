import type {MetadataRoute} from 'next'
import {shopifyClient} from '@/lib/shopify'
import {COLLECTIONS_QUERY, PRODUCTS_QUERY} from '@/lib/queries'
import {absoluteUrl} from '@/lib/seo'
import {serverLogger} from '@/lib/logger.server'

type SitemapProduct = {
  handle: string
}

type SitemapCollection = {
  handle: string
}

type ProductsResponse = {
  products: {
    edges: Array<{node: SitemapProduct}>
  }
}

type CollectionsResponse = {
  collections: {
    edges: Array<{node: SitemapCollection}>
  }
}

const STATIC_ROUTES = [
  '/',
  '/collections',
  '/noutati',
  '/oferte',
  '/contact',
  '/despre-noi',
  '/ghid-marimi',
  '/help-center',
  '/intrebari-frecvente',
  '/livrare-gratuita',
  '/politica-confidentialitate',
  '/politica-cookie',
  '/politica-retur',
  '/termeni-si-conditii',
]

async function getProductRoutes() {
  try {
    const {data} = await shopifyClient.request<ProductsResponse>(PRODUCTS_QUERY, {
      first: 250,
    })

    return data.products.edges.map(({node}) => `/products/${node.handle}`)
  } catch (error) {
    serverLogger.warn('sitemap.products.failed', error)
    return []
  }
}

async function getCollectionRoutes() {
  try {
    const {data} = await shopifyClient.request<CollectionsResponse>(
      COLLECTIONS_QUERY,
      {first: 250}
    )

    return data.collections.edges
      .map(({node}) => node.handle)
      .filter((handle) => handle !== 'frontpage' && handle !== 'home')
      .map((handle) => `/collections/${handle}`)
  } catch (error) {
    serverLogger.warn('sitemap.collections.failed', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productRoutes, collectionRoutes] = await Promise.all([
    getProductRoutes(),
    getCollectionRoutes(),
  ])

  return [...STATIC_ROUTES, ...collectionRoutes, ...productRoutes].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : route.startsWith('/products') ? 0.8 : 0.7,
  }))
}
