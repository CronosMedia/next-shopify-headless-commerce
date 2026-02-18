'use client'

import { useRecentlyViewed } from '@/lib/useRecentlyViewed'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, MouseEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
    const { viewedProducts, isInitialized } = useRecentlyViewed()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [hasMoved, setHasMoved] = useState(false)

    if (!isInitialized) return null

    // Filter out the current product from the display list if desired, 
    // or keep it. Usually it's nice to see what you just looked at too, 
    // but often "Recently Viewed" excludes the current one.
    // Let's exclude the current one for a cleaner experience as you are already looking at it.
    const displayProducts = viewedProducts.filter(p => p.id !== currentProductId)

    if (displayProducts.length === 0) return null

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const startDragging = (e: MouseEvent) => {
        setIsDragging(true)
        setHasMoved(false)
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
        setScrollLeft(scrollRef.current?.scrollLeft || 0)
    }

    const stopDragging = () => {
        setIsDragging(false)
        // small timeout to prevent click trigger immediately after drag? 
        // actually HasMoved check on Link click is better but Link is a next/link.
        // We'll rely on global cursor styles for feedback for now.
    }

    const onDrag = (e: MouseEvent) => {
        if (!isDragging || !scrollRef.current) return
        e.preventDefault()
        const x = e.pageX - (scrollRef.current.offsetLeft || 0)
        const walk = (x - startX) * 1.5 // Reduced multiplier for smoother control
        scrollRef.current.scrollLeft = scrollLeft - walk
        if (Math.abs(walk) > 5) setHasMoved(true)
    }

    return (
        <section className="py-12 border-t border-gray-100 relative group/section">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-2xl font-bold mb-8">Produse vizualizate recent</h2>

                <div className="relative group">
                    <button
                        onClick={() => scroll('left')}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={20} />
                    </button>

                    <div
                        ref={scrollRef}
                        className={cn(
                            "flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide select-none",
                            isDragging ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth"
                        )}
                        onMouseDown={startDragging}
                        onMouseLeave={stopDragging}
                        onMouseUp={stopDragging}
                        onMouseMove={onDrag}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayProducts.map((product) => (
                            <div key={product.id} className="min-w-[200px] w-[200px]" onClick={(e) => {
                                if (hasMoved) e.preventDefault()
                            }}>
                                <Link
                                    href={`/products/${product.handle}`}
                                    className="group block"
                                    onClick={(e) => { if (hasMoved) { e.preventDefault() } }}
                                    draggable={false}
                                >
                                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-3">
                                        {product.featuredImage ? (
                                            <Image
                                                src={product.featuredImage.url}
                                                alt={product.featuredImage.altText || product.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="200px"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 group-hover:underline decoration-1 underline-offset-2 truncate">
                                        {product.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {Number(product.price).toFixed(2)} {product.currencyCode}
                                    </p>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
