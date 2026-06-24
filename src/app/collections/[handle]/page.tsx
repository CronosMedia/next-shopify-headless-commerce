import { shopifyClient } from '@/lib/shopify'
import { COLLECTION_PRODUCT_QUERY } from '@/lib/queries'
import CollectionProductGrid from '@/components/CollectionProductGrid'
import { notFound } from 'next/navigation'
import {cache} from 'react'
import type {Metadata} from 'next'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
  safeJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/seo'

type PageProps = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

type CollectionProduct = {
  id: string
  handle: string
  title: string
  vendor: string
  productType: string
  tags: string[]
  options?: Array<{ name: string; values: string[] }>
  featuredImage: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange: {
    minVariantPrice: {amount: string; currencyCode: string}
  }
  availableForSale: boolean
  variants: {
    edges: Array<{
      node: {id: string; availableForSale: boolean}
    }>
  }
}

type CollectionProductsData = {
  collection: {
    id: string
    handle: string
    title: string
    description: string
    image: {
      url: string
      altText: string | null
      width: number
      height: number
    } | null
    products: {
      edges: Array<{node: CollectionProduct}>
    }
  } | null
}

const getCollection = cache(
  async (handle: string, sortKey = 'COLLECTION_DEFAULT', reverse = false) => {
    const {data} = await shopifyClient.request<CollectionProductsData>(
      COLLECTION_PRODUCT_QUERY,
      {handle, sortKey, reverse}
    )

    return data?.collection || null
  }
)

function getSortOptions(sortParam: string | undefined) {
  switch (sortParam) {
    case 'newest':
      return {sortKey: 'CREATED', reverse: true}
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false}
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true}
    case 'best-selling':
      return {sortKey: 'BEST_SELLING', reverse: false}
    case 'relevance':
    default:
      return {sortKey: 'COLLECTION_DEFAULT', reverse: false}
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>
}): Promise<Metadata> {
  const {handle} = await params
  const collection = await getCollection(handle)

  if (!collection) {
    return {
      title: 'Colecție indisponibilă',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = collection.description || SITE_DESCRIPTION
  const url = absoluteUrl(`/collections/${collection.handle}`)

  return {
    title: collection.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: collection.title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: collection.image?.url
        ? [{url: collection.image.url, alt: collection.image.altText || collection.title}]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: collection.title,
      description,
      images: collection.image?.url ? [collection.image.url] : [],
    },
  }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { handle } = await params
  const resolvedSearchParams = await searchParams
  const sortParam =
    typeof resolvedSearchParams.sort === 'string'
      ? resolvedSearchParams.sort
      : undefined
  const {sortKey, reverse} = getSortOptions(sortParam)

  try {
    const collection = await getCollection(handle, sortKey, reverse)

    if (!collection) {
      notFound()
    }

    const products = collection.products.edges.map(({node}) => node)

    return (
      <main className="w-full px-4 md:px-8 lg:px-12 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              breadcrumbJsonLd([
                {name: 'Home', path: '/'},
                {name: 'Colecții', path: '/collections'},
                {name: collection.title, path: `/collections/${collection.handle}`},
              ])
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              itemListJsonLd(
                products.map((product) => ({
                  name: product.title,
                  path: `/products/${product.handle}`,
                })),
                'CollectionPage'
              )
            ),
          }}
        />
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.12em] uppercase text-[var(--foreground)]">{collection.title}</h1>
        </div>

        <CollectionProductGrid
          initialProducts={products}
          collectionTitle={collection.title}
        />
      </main>
    )
  } catch {
    notFound()
  }
}
