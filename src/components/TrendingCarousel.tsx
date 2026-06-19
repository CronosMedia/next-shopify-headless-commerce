'use client'

import { useRef } from 'react'
import ProductCard from './ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Product = {
    id: string
    handle: string
    title: string
    vendor?: string
    description: string
    featuredImage?: {
        url: string
        altText: string | null
        width: number
        height: number
    } | null
    priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
    variants?: {
        edges: {
            node: {
                id: string
                availableForSale: boolean
            }
        }[]
    }
}

export default function TrendingCarousel({ products }: { products: Product[] }) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const container = scrollRef.current
        const cardWidth = container.querySelector('div')?.offsetWidth || 300
        const gap = window.innerWidth >= 768 ? 24 : 16 // md:gap-6 is 24px, gap-4 is 16px
        const scrollAmount = cardWidth + gap
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className="relative group/carousel">
            {/* Minimal Navigation Arrows - Styled and visible on desktop */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-4 top-[40%] -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/95 border border-[var(--border)] rounded-full text-[#1a1a1a] shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hidden md:flex"
                aria-label="Scroll left"
            >
                <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-4 top-[40%] -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/95 border border-[var(--border)] rounded-full text-[#1a1a1a] shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hidden md:flex"
                aria-label="Scroll right"
            >
                <ChevronRight size={20} strokeWidth={1.5} />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 overflow-x-auto px-5 md:px-10 pb-12 snap-x snap-mandatory scroll-px-5 md:scroll-px-10 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="flex-shrink-0 w-[75vw] max-w-[280px] md:w-[300px] lg:w-[360px] snap-center md:snap-start"
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}
