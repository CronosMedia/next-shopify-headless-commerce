import Link from 'next/link'
import Image from 'next/image'
import { shopifyClient } from '@/lib/shopify'
import { COLLECTIONS_QUERY } from '@/lib/queries'
import {defaultMetadata, itemListJsonLd, safeJsonLd} from '@/lib/seo'

export const metadata = defaultMetadata(
    'Colecții',
    'Explorează colecțiile Maison Outdoor.',
    '/collections'
)

// Add revalidation to ensure we don't serve stale data forever
export const revalidate = 3600 // Revalidate every hour

const FALLBACK_IMAGES = [
    '/images/hero/hero-hires-v5.jpg',
    '/images/hero/editorial-outdoor.png',
    '/images/hero/campaign-outdoor.jpg',
    '/images/collections/outdoor-gadgets.png',
    '/images/hero/editorial-men.png',
    '/images/hero/hero-hires-v3.jpg',
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
        collections = (data?.collections?.edges?.map((edge) => edge.node) || [])
            .filter((col) => col.handle !== 'frontpage' && col.handle !== 'home')
    } catch {
        collections = []
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-12 pb-0 md:pt-24 md:pb-24">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: safeJsonLd(
                        itemListJsonLd(
                            collections.map((collection) => ({
                                name: collection.title,
                                path: `/collections/${collection.handle}`,
                            })),
                            'CollectionPage'
                        )
                    ),
                }}
            />
            {/* Elegant Header */}
            <div className="text-center mb-16 md:mb-24">
                <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-[#8a8a8a] mb-4 block">
                    Maison Outdoor
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-[0.15em] uppercase text-[#1a1a1a] leading-tight">
                    Categorii
                </h1>
                <div className="h-[1px] w-12 bg-[#1a1a1a]/20 mx-auto mt-6" />
            </div>

            {collections.length > 0 ? (
                <div 
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:gap-10 lg:gap-12 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {collections.map((collection, index) => {
                        // Use Shopify image if available, otherwise cycle through fallbacks based on index
                        const imageUrl = collection.image?.url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

                        return (
                            <Link
                                key={collection.id}
                                href={`/collections/${collection.handle}`}
                                className="group block relative overflow-hidden aspect-[3/5] md:aspect-[4/5] bg-[#F9F8F6] shadow-sm transition-all duration-700 ease-in-out hover:shadow-xl flex-shrink-0 w-[75vw] max-w-[280px] snap-center md:w-auto md:max-w-none md:snap-align-none"
                            >
                                <Image
                                    src={imageUrl}
                                    alt={collection.image?.altText || collection.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority={index < 3}
                                />
                                {/* Gradient overlay for text contrast */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 opacity-85 group-hover:opacity-90 transition-opacity duration-500" />
                                
                                {/* Floating text content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-10">
                                    <h2 className="text-xl md:text-2xl font-light tracking-[0.15em] uppercase text-white mb-2 [text-shadow:_0_1px_4px_rgba(0,0,0,0.3)]">
                                        {collection.title}
                                    </h2>
                                    {collection.description && (
                                        <p className="text-white/80 text-xs md:text-sm font-light tracking-wide line-clamp-2 max-w-sm [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)] transition-colors duration-300 group-hover:text-white">
                                            {collection.description}
                                        </p>
                                    )}
                                    <div className="mt-5 inline-flex items-center gap-2 text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-white/90 group-hover:text-white transition-colors">
                                        Explorează
                                        <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-[#F9F8F6] border border-[#e5e4e0] rounded-none">
                    <p className="text-[#8a8a8a] text-sm tracking-wider uppercase">Nu există categorii disponibile momentan.</p>
                </div>
            )}
        </div>
    )
}
