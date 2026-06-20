'use client'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'

type ProductNode = {
  id: string
  handle: string
  title: string
  vendor?: string
  description?: string
  featuredImage?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
  variants?: {
    edges: Array<{
      node: {
        id: string
        availableForSale: boolean
      }
    }>
  }
}

export default function RelatedProducts({ currentProductId }: { currentProductId?: string }) {
  const [products, setProducts] = useState<ProductNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let finalProducts: ProductNode[] = []

        if (currentProductId) {
          const response = await fetch(
            `/api/products/recommendations?productId=${currentProductId}`
          )

          if (response.ok) {
            const data = await response.json()
            finalProducts = data.products || []
          }
        }

        // Fallback if no recommendations or no currentProductId
        if (finalProducts.length === 0) {
          const fallbackResponse = await fetch('/api/products/newest')
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            finalProducts = data.products || []
          }
        }

        // Filter out current product and slice to up to 8 items
        const validProducts = finalProducts
          .filter(p => p.id !== currentProductId) // Exclude current
          .slice(0, 8)

        setProducts(validProducts)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentProductId])

  if (loading || products.length === 0) return null

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 animate-fadeIn overflow-hidden lg:overflow-visible">
      {/* Left Aligned Header - Thicker font on mobile */}
      <h2 className="text-[15px] md:text-2xl font-semibold md:font-light tracking-[0.16em] md:tracking-[0.25em] uppercase text-neutral-900 mb-10 md:mb-16 text-left leading-relaxed">
        Poate te interesează și...
      </h2>

      {/* Responsive Container: 
          - Mobile/Tablet: Horizontal edge-to-edge scrollable carousel
          - Desktop (lg): Static 4-column grid
      */}
      <div 
        className="flex lg:grid gap-4 md:gap-6 lg:gap-8 overflow-x-auto lg:overflow-x-visible pb-8 lg:pb-0 snap-x snap-mandatory lg:snap-none scroll-px-6 lg:scroll-px-0 -mx-6 px-6 md:-mx-12 md:px-12 lg:mx-0 lg:px-0 lg:grid-cols-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[75vw] max-w-[260px] md:w-[280px] lg:w-auto lg:max-w-none lg:flex-shrink snap-center md:snap-start lg:snap-align-none"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
