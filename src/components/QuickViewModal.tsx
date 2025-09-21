'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/components/UIProvider'
import BuyBox, { Variant } from '@/app/products/[handle]/BuyBox'
import Image from 'next/image'

// Define a more complete product type for the modal
type Product = {
  handle: string
  title: string
  featuredImage?: {
    url: string
    altText: string | null
  }
  options: any[]
  variants: {
    edges: { node: Variant }[]
  }
}

export default function QuickViewModal() {
  const { isQuickViewOpen, closeQuickView, quickViewProduct } = useUI()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (quickViewProduct?.handle) {
      setLoading(true)
      fetch(`/api/products/${quickViewProduct.handle}`)
        .then((res) => res.json())
        .then((data) => {
          setProduct(data.product)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to fetch product for quick view', err)
          setLoading(false)
          closeQuickView()
        })
    } else {
      setProduct(null)
    }
  }, [quickViewProduct, closeQuickView])

  if (!isQuickViewOpen || !quickViewProduct) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-10 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
          aria-label="Close quick view"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {loading || !product ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-center">
              {product.featuredImage && (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  width={400}
                  height={400}
                  className="object-contain"
                />
              )}
            </div>
            <div>
              <BuyBox
                title={product.title}
                options={product.options}
                variants={product.variants.edges.map((e) => e.node)}
                onAddToCartSuccess={closeQuickView}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
