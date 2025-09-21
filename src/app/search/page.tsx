'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'

type Product = {
  id: string
  handle: string
  title: string
  description: string
  featuredImage: {
    url: string
    altText: string
    width: number
    height: number
  } | null
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
}

function SearchContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchQuery) {
      setLoading(false)
      return
    }

    const fetchSearchResults = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error?.message || 'Failed to fetch search results.'
          )
        }

        setProducts(data.products)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">
          Searching for "{searchQuery}"...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!searchQuery) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Please enter a search query.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Search Results for "{searchQuery}"
      </h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">
          No products found matching your query.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-6 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
