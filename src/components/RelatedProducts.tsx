'use client'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { useCart } from '@/components/CartProvider'

type ProductNode = {
  id: string
  handle: string
  title: string
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

export default function RelatedProducts() {
  const [products, setProducts] = useState<ProductNode[]>([])
  const [loading, setLoading] = useState(true)
  const { cart } = useCart()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let finalProducts: ProductNode[] = []
        const cartProductIds = new Set(
          cart?.lines.edges.map((edge) => edge.node.merchandise.product.id) || []
        )

        // 1. Încearcă să obții recomandări
        if (cart && cart.lines.edges.length > 0) {
          const firstProduct = cart.lines.edges[0].node.merchandise.product
          if (firstProduct && firstProduct.id) {
            const response = await fetch(
              `/api/products/recommendations?productId=${firstProduct.id}`
            )
            if (response.ok) {
              const data = await response.json()
              const recommendedProducts: ProductNode[] = data.products || []
              // Filtrează recomandările
              finalProducts = recommendedProducts.filter(
                (p) => !cartProductIds.has(p.id)
              )
            }
          }
        }

        // 2. Fallback la cele mai noi produse dacă nu s-au găsit recomandări valide
        if (finalProducts.length === 0) {
          const response = await fetch('/api/products/newest')
          if (response.ok) {
            const data = await response.json()
            const newestProducts: ProductNode[] = data.products || []
            // Filtrează și produsele noi
            finalProducts = newestProducts.filter(
              (p) => !cartProductIds.has(p.id)
            )
          }
        }

        // 3. Filtrează produsele fără stoc
        const inStockProducts = finalProducts.filter(
          (p) => p.variants?.edges[0]?.node.availableForSale
        )

        setProducts(inStockProducts.slice(0, 3))
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [cart?.totalQuantity])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 h-96 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}


