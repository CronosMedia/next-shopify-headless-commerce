'use client'
import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'

type Product = {
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
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
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
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-12 pb-12 md:pt-24 md:pb-24">
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col h-full bg-white animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#F9F8F6]" />
              <div className="mt-4 h-4 bg-gray-200 w-1/3" />
              <div className="mt-2 h-4 bg-gray-200 w-3/4" />
              <div className="mt-3 h-4 bg-gray-200 w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-[var(--border)] bg-gray-50/50">
          <p className="text-sm font-light text-[var(--muted-foreground)] tracking-wide">
            Nu am găsit produse noi în acest moment. Te rugăm să revii mai târziu.
          </p>
        </div>
      )}
    </div>
  )
}

