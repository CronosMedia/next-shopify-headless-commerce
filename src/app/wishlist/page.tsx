'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useWishlist } from '@/components/WishlistProvider'
import { ProductGridSkeleton } from '@/components/skeletons/ListingSkeletons'

export default function WishlistPage() {
    const { items, ready } = useWishlist()
    const [visibleCount, setVisibleCount] = useState(12)

    const visibleItems = items.slice(0, visibleCount)

    return (
        <main className="w-full px-4 md:px-8 lg:px-12 py-10">
            <div className="mb-8 md:mb-10">
                <p className="text-[10px] md:text-xs font-semibold tracking-[0.22em] uppercase text-[var(--muted-foreground)] mb-3">
                    Maison Outdoor
                </p>
                <h1 className="text-2xl md:text-3xl font-light tracking-[0.12em] uppercase text-[var(--foreground)]">
                    Lista ta de dorințe
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] max-w-xl">
                    Salvează produsele preferate și revino la ele mai târziu.
                </p>
            </div>

            <div className="relative min-h-screen bg-[var(--background)]">
                <div className="relative border-b border-[var(--border)] py-4 bg-[var(--background)] z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-[11px] tracking-[0.1em] uppercase text-neutral-500">
                            <span className="text-black font-semibold">{ready ? items.length : 0}</span>{' '}
                            {items.length === 1 ? 'produs salvat' : 'produse salvate'}
                        </div>
                        <Link
                            href="/collections"
                            className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--foreground)] underline underline-offset-4"
                        >
                            Descoperă produse
                        </Link>
                    </div>
                </div>

                <div className="w-full py-10 pb-24">
                    {!ready ? (
                        <ProductGridSkeleton className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
                    ) : items.length > 0 ? (
                        <>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                                {visibleItems.map((item) => {
                                    const product = {
                                        ...item,
                                        featuredImage: item.featuredImage
                                            ? {
                                                url: item.featuredImage.url,
                                                altText: item.featuredImage.altText ?? null,
                                                width: 800,
                                                height: 1067,
                                            }
                                            : null,
                                    }

                                    return (
                                        <li key={item.id} className="w-full">
                                            <ProductCard product={product} />
                                        </li>
                                    )
                                })}
                            </ul>

                            {items.length > visibleCount ? (
                                <div className="flex justify-center mt-16">
                                    <button
                                        onClick={() => setVisibleCount((prev) => prev + 12)}
                                        className="border border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-300 text-xs font-semibold uppercase tracking-[0.2em] px-10 py-4 cursor-pointer"
                                    >
                                        Încarcă mai multe
                                    </button>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="min-h-[44vh] flex items-center justify-center py-16">
                            <div className="max-w-xl text-center px-4">
                                <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center border border-[var(--border)] bg-white text-[var(--foreground)]">
                                    <Heart size={20} strokeWidth={1.5} />
                                </div>
                                <h2 className="text-lg md:text-xl font-light tracking-[0.12em] uppercase text-[var(--foreground)] mb-4">
                                    Lista ta de dorințe este goală
                                </h2>
                                <p className="text-sm md:text-base text-[var(--muted-foreground)] leading-8 mb-8">
                                    Salvează produsele preferate și revino la ele mai târziu.
                                </p>
                                <Link
                                    href="/collections"
                                    className="inline-flex h-12 items-center justify-center bg-[var(--foreground)] text-white px-8 text-[11px] font-semibold tracking-[0.18em] uppercase hover:bg-black transition-colors"
                                >
                                    Descoperă produse
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
