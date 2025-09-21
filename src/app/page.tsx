import { shopifyClient } from '@/lib/shopify'
import { PRODUCTS_QUERY } from '@/lib/queries'
import ProductCard from '@/components/ProductCard'

type ProductNode = {
  id: string
  handle: string
  title: string
  description: string
  featuredImage?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
}

async function getProducts(): Promise<ProductNode[]> {
  const data: any = await shopifyClient.request(PRODUCTS_QUERY, {
    first: 12,
  })
  const edges = data?.data?.products?.edges ?? []
  return edges.map((e: any) => e.node) as ProductNode[]
}

export default async function Home() {
  const products = await getProducts()
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to Next Commerce
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover premium health and wellness products with fast shipping and
          excellent customer service.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}
