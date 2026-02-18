'use client'
import { useEffect, useState, useRef, MouseEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProductNode = {
  id: string
  handle: string
  title: string
  featuredImage?: {
    url: string
    altText: string | null
  } | null
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
  variants?: {
    edges: {
      node: {
        price: { amount: string; currencyCode: string }
        availableForSale: boolean
      }
    }[]
  }
}

export default function RelatedProducts({ currentProductId }: { currentProductId?: string }) {
  const [products, setProducts] = useState<ProductNode[]>([])
  const [loading, setLoading] = useState(true)

  // Carousel State
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let finalProducts: ProductNode[] = []

        console.log('RelatedProducts: currentProductId', currentProductId)
        if (currentProductId) {
          const response = await fetch(
            `/api/products/recommendations?productId=${currentProductId}`
          )

          if (response.ok) {
            const data = await response.json()
            console.log('RelatedProducts: recommendations data', data)
            finalProducts = data.products || []
          }
        }

        // Fallback if no recommendations or no currentProductId
        if (finalProducts.length === 0) {
          console.log('RelatedProducts: Falling back to newest')
          const fallbackResponse = await fetch('/api/products/newest')
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            console.log('RelatedProducts: newest data', data)
            finalProducts = data.products || []
          }
        }

        console.log('RelatedProducts: finalProducts before filter', finalProducts.length)

        // Filter out current product and unavailable
        const validProducts = finalProducts
          .filter(p => p.id !== currentProductId) // Exclude current
          .slice(0, 8) // Limit to 8 items

        console.log('RelatedProducts: validProducts after filter', validProducts.length)

        setProducts(validProducts)
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentProductId])

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
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    scrollRef.current.scrollLeft = scrollLeft - walk
    if (Math.abs(walk) > 5) setHasMoved(true)
  }

  if (loading || products.length === 0) return null

  return (
    <section className="py-12 border-t border-gray-100 relative group/section">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold mb-8">Poate te interesează și...</h2>

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
            {products.map((product) => {
              const variant = product.variants?.edges[0]?.node
              const price = variant?.price?.amount || product.priceRange?.minVariantPrice?.amount || '0'
              const currency = variant?.price?.currencyCode || product.priceRange?.minVariantPrice?.currencyCode || 'RON'

              return (
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
                      {Number(price).toFixed(2)} {currency}
                    </p>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}


