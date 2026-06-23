import { shopifyClient } from '@/lib/shopify'
import { COLLECTION_PRODUCT_QUERY } from '@/lib/queries'
import CollectionProductGrid from '@/components/CollectionProductGrid'
import { notFound } from 'next/navigation'

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
    title: string
    products: {
      edges: Array<{node: CollectionProduct}>
    }
  } | null
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { handle } = await params
  const resolvedSearchParams = await searchParams
  const sortParam = resolvedSearchParams.sort as string

  // Map URL sort param to Shopify sortKey and reverse
  let sortKey = 'RELEVANCE'
  let reverse = false

  switch (sortParam) {
    case 'newest':
      sortKey = 'CREATED'
      reverse = true
      break
    case 'price-asc':
      sortKey = 'PRICE'
      reverse = false
      break
    case 'price-desc':
      sortKey = 'PRICE'
      reverse = true
      break
    case 'best-selling':
      sortKey = 'BEST_SELLING'
      reverse = false
      break
    case 'relevance':
    default:
      sortKey = 'COLLECTION_DEFAULT'
      reverse = false
      break
  }

  try {
    const {data} = await shopifyClient.request<CollectionProductsData>(
      COLLECTION_PRODUCT_QUERY,
      {handle, sortKey, reverse}
    )

    const collection = data?.collection

    if (!collection) {
      notFound()
    }

    const products = collection.products.edges.map(({node}) => node)

    return (
      <main className="w-full px-4 md:px-8 lg:px-12 py-10">
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
