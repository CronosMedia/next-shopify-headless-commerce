import { shopifyClient } from '@/lib/shopify'
import { COLLECTION_PRODUCT_QUERY } from '@/lib/queries'
import CollectionProductGrid from '@/components/CollectionProductGrid'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

  console.log('CollectionPage params:', { handle, sortParam, sortKey, reverse })

  try {
    const { data } = await shopifyClient.request<any>(COLLECTION_PRODUCT_QUERY, {
      handle,
      sortKey,
      reverse
    })

    const collection = data?.collection

    if (!collection) {
      notFound()
    }

    const products = collection.products.edges.map((edge: any) => edge.node)

    return (
      <main className="w-full px-4 md:px-8 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{collection.title}</h1>
          {/* Description could go here */}
        </div>

        <CollectionProductGrid
          initialProducts={products}
          collectionTitle={collection.title}
        />
      </main>
    )
  } catch (error) {
    console.error('Error fetching collection:', error)
    notFound()
  }
}
