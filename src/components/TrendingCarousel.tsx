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
        const scrollAmount = cardWidth + 24 // card width + gap
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className="relative group/carousel">
            {/* Minimal Navigation Arrows */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-6 top-[40%] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-[#1a1a1a] opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 hover:text-[#8a8a8a]"
                aria-label="Scroll left"
            >
                <ChevronLeft size={24} strokeWidth={1} />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-6 top-[40%] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-[#1a1a1a] opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 hover:text-[#8a8a8a]"
                aria-label="Scroll right"
            >
                <ChevronRight size={24} strokeWidth={1} />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-12 overflow-x-auto px-6 md:px-10 lg:px-16 pb-12 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="flex-shrink-0 w-[240px] md:w-[300px] lg:w-[360px] snap-start"
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}
