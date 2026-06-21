'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/components/WishlistProvider'
import { formatMoney } from '@/lib/utils'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
    const { items, toggleItem } = useWishlist()
    const [visibleCount, setVisibleCount] = useState(12)

    const visibleItems = items.slice(0, visibleCount)

    return (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-24 min-h-[60vh]">
            {/* Elegant Header */}
            <div className="text-center mb-16 md:mb-24">
                <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-[#8a8a8a] mb-4 block">
                    Maison Outdoor
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-[0.15em] uppercase text-[#1a1a1a] leading-tight">
                    Lista ta de dorințe
                </h1>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[#8a8a8a] mt-4 block">
                    {items.length} {items.length === 1 ? 'PRODUS SALVAT' : 'PRODUSE SALVATE'}
                </p>
                <div className="h-[1px] w-12 bg-[#1a1a1a]/20 mx-auto mt-6" />
            </div>

            {items.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                        {visibleItems.map((item) => {
                            const price = item.priceRange?.minVariantPrice?.amount
                                ? Number(item.priceRange.minVariantPrice.amount).toFixed(2)
                                : null

                            return (
                                <div
                                    key={item.id}
                                    className="group relative flex flex-col h-full bg-white"
                                >
                                    {/* Image Container with subtle zoom */}
                                    <div className="relative overflow-hidden aspect-[3/4] bg-[#F9F8F6]">
                                        <Link href={`/products/${item.handle}`} className="block w-full h-full">
                                            {item.featuredImage?.url ? (
                                                <Image
                                                    src={item.featuredImage.url}
                                                    alt={item.featuredImage.altText || item.title}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                    className="object-cover transition-all duration-[1200ms] ease-out group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#a0a0a0]">Maison</span>
                                                </div>
                                            )}
                                        </Link>

                                        {/* Subtle hover state indication */}
                                        <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/[0.01] transition-colors duration-500" />

                                        {/* Wishlist Heart Button - Top Right (Floating) */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                toggleItem(item)
                                            }}
                                            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white border border-neutral-100 shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 p-0 cursor-pointer"
                                            aria-label="Elimină de la favorite"
                                        >
                                            <Heart
                                                size={16}
                                                className="text-red-500 fill-red-500 transition-all duration-300"
                                            />
                                        </button>
                                    </div>

                                    {/* Product Information */}
                                    <div className="pt-4 pb-3 flex flex-col items-start px-0.5 flex-1">
                                        <Link href={`/products/${item.handle}`} className="block w-full">
                                            <h2 className="text-[13px] md:text-sm font-light leading-relaxed text-neutral-800 tracking-wide truncate hover:text-black transition-colors duration-300">
                                                {item.title}
                                            </h2>
                                        </Link>

                                        <div className="mt-1.5 flex items-center justify-between w-full">
                                            {price && item.priceRange?.minVariantPrice ? (
                                                <span className="text-sm font-semibold tracking-wide text-neutral-900">
                                                    {formatMoney(item.priceRange.minVariantPrice.amount, item.priceRange.minVariantPrice.currencyCode)}
                                                </span>
                                            ) : (
                                                <span className="text-xs uppercase tracking-[0.1em] text-neutral-400">La cerere</span>
                                            )}
                                        </div>

                                        {/* Direct CTA button (Vezi produs) */}
                                        <Link
                                            href={`/products/${item.handle}`}
                                            className="w-full text-center border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] md:tracking-[0.2em] py-2.5 md:py-3.5 mt-3 md:mt-5 block cursor-pointer"
                                        >
                                            Vezi produs
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Load More Button */}
                    {items.length > visibleCount && (
                        <div className="flex justify-center mt-16">
                            <button
                                onClick={() => setVisibleCount((prev) => prev + 12)}
                                className="border border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-300 text-xs font-semibold uppercase tracking-[0.2em] px-10 py-4 cursor-pointer"
                            >
                                Încarcă mai multe
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20 px-6 bg-white border border-[#f0efed] max-w-xl mx-auto flex flex-col items-center">
                    <Heart size={32} strokeWidth={1} className="text-neutral-400 mb-6 animate-pulse" />
                    <h2 className="text-base font-light tracking-[0.18em] uppercase text-neutral-800 mb-3">
                        LISTA TA DE DORINȚE ESTE GOALĂ
                    </h2>
                    <p className="text-sm text-neutral-500 tracking-wide mb-8 max-w-sm leading-relaxed">
                        Explorează colecțiile noastre și adaugă produsele preferate pentru a le salva aici.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-black text-white px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                        Deschide magazinul
                    </Link>
                </div>
            )}
        </div>
    )
}
