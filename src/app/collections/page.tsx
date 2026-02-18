import Link from 'next/link'
import Image from 'next/image'
import { shopifyClient } from '@/lib/shopify'
import { COLLECTIONS_QUERY } from '@/lib/queries'

// Add revalidation to ensure we don't serve stale data forever
export const revalidate = 3600 // Revalidate every hour

const FALLBACK_IMAGES = [
    '/images/collections/supplements.png',
    '/images/collections/lifestyle.png',
]


type CollectionsResponse = {
    collections: {
        edges: Array<{
            node: {
                id: string
                handle: string
                title: string
                description: string
                image: {
                    url: string
                    altText: string
                    width: number
                    height: number
                } | null
            }
        }>
    }
}


type Collection = CollectionsResponse['collections']['edges'][0]['node']

export default async function CollectionsPage() {
    let collections: Collection[] = []

    try {
        const { data } = await shopifyClient.request<CollectionsResponse>(COLLECTIONS_QUERY, {
            first: 20
        })
        collections = data?.collections?.edges?.map((edge) => edge.node) || []
    } catch (error) {
        console.error('Error fetching collections:', error)
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Categorii</h1>

            {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection: any, index: number) => {
                        // Use Shopify image if available, otherwise cycle through fallbacks based on index
                        const imageUrl = collection.image?.url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

                        return (
                            <Link
                                key={collection.id}
                                href={`/collections/${collection.handle}`}
                                className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="relative aspect-[16/9] bg-gray-100">
                                    <Image
                                        src={imageUrl}
                                        alt={collection.image?.altText || collection.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                        {collection.title}
                                    </h2>
                                    {collection.description && (
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {collection.description}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">Nu există categorii disponibile momentan.</p>
                </div>
            )}
        </div>
    )
}
