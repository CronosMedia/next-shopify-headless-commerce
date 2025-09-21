import Image from 'next/image'
import Link from 'next/link'
import { shopifyClient } from '@/lib/shopify'

const COLLECTION_QUERY = `#graphql
  query CollectionByHandle($handle: String!, $first: Int = 12) {
    collection(handle: $handle) {
      id
      title
      products(first: $first) {
        edges { node { id handle title featuredImage { url altText width height } } }
      }
    }
  }
`

type PageProps = { params: Promise<{ handle: string }> }

export default async function CollectionPage({ params }: PageProps) {
  const { handle } = await params
  const data: any = await shopifyClient.request(COLLECTION_QUERY, {
    handle,
    first: 12,
  })
  const col = data?.data?.collection
  if (!col) return null
  const products = (col.products?.edges || []).map((e: any) => e.node)
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{col.title}</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p: any) => (
          <li key={p.id} className="border rounded-lg overflow-hidden">
            <Link href={`/products/${p.handle}`} className="block">
              {p.featuredImage?.url ? (
                <Image
                  src={p.featuredImage.url}
                  alt={p.featuredImage.altText || p.title}
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="aspect-square bg-gray-100" />
              )}
              <div className="p-4">{p.title}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
