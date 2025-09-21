'use client'
import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'

type Product = {
  id: string
  handle: string
  title: string
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
          console.error('Failed to fetch newest products:', data.error)
        }
      } catch (error) {
        console.error('Error fetching newest products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNewestProducts()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Noutăți</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="bg-gray-200 h-48 w-full rounded-lg"></div>
              <div className="mt-4 h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          Nu am găsit produse noi în acest moment. Te rugăm să revii mai târziu.
        </p>
      )}
    </div>
  )
}
