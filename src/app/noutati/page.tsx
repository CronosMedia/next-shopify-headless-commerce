'use client'
import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { ProductGridSkeleton } from '@/components/skeletons/ListingSkeletons'

type Product = {
  id: string
  handle: string
  title: string
  vendor?: string
  productType?: string
  description?: string
  featuredImage?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  options?: Array<{ name: string; values: string[] }>
  variants?: {
    edges: {
      node: {
        id: string
        availableForSale: boolean
      }
    }[]
  }
}

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNewestProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products/newest')
        const data = await response.json()
        if (response.ok) {
          setProducts(data.products)
        } else {
          setProducts([])
        }
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNewestProducts()
  }, [])

  return (
    <main className="w-full px-4 md:px-8 lg:px-12 py-10">
      {/* Elegant Header */}
      <div className="text-center mb-16 md:mb-24">
        <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-[#8a8a8a] mb-4 block">
          Maison Outdoor
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-[0.15em] uppercase text-[#1a1a1a] leading-tight">
          Noutăți
        </h1>
        <div className="h-[1px] w-12 bg-[#1a1a1a]/20 mx-auto mt-6" />
      </div>

      <div className="relative min-h-screen bg-[var(--background)]">
        <div className="w-full px-4 md:px-8 lg:px-12 py-10 pb-24">
          {loading ? (
            <ProductGridSkeleton />
          ) : products.length > 0 ? (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product) => (
                <li key={product.id} className="w-full">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-20 border border-[var(--border)] bg-gray-50/50">
              <p className="text-sm font-light text-[var(--muted-foreground)] tracking-wide">
                Nu am găsit produse noi în acest moment. Te rugăm să revii mai târziu.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
