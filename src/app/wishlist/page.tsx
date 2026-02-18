'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/components/WishlistProvider'
import WishlistButton from '@/components/WishlistButton'

export default function WishlistPage() {
    const { items } = useWishlist()

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Lista ta de dorințe</h1>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative"
                        >
                            <div className="absolute top-2 right-2 z-10">
                                <WishlistButton item={item} variant="icon" />
                            </div>
                            <Link href={`/products/${item.handle}`} className="block">
                                <div className="relative aspect-square bg-gray-100">
                                    {item.featuredImage ? (
                                        <Image
                                            src={item.featuredImage.url}
                                            alt={item.featuredImage.altText || item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            Fără imagine
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h2>
                                    {item.priceRange && (
                                        <p className="text-gray-600">
                                            {item.priceRange.minVariantPrice.amount}{' '}
                                            {item.priceRange.minVariantPrice.currencyCode}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg mb-4">
                        Nu ai niciun produs în lista de dorințe.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        Continuă cumpărăturile
                    </Link>
                </div>
            )}
        </div>
    )
}
