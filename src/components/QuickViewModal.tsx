'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/components/UIProvider'
import BuyBox, { Variant } from '@/app/products/[handle]/BuyBox'
import Image from 'next/image'
import { X } from 'lucide-react'

// Define a more complete product type for the modal
type Product = {
  handle: string
  title: string
  featuredImage?: {
    url: string
    altText: string | null
  }
  options: Array<{name: string; values: string[]}>
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
        .catch(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Clickable Backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-black/45 backdrop-blur-xs cursor-default animate-in fade-in duration-200"
        onClick={closeQuickView}
        aria-label="Închide previzualizarea"
      />

      {/* Modal Card Box */}
      <div className="relative w-full max-w-4xl bg-white rounded-none border border-[var(--border)] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-black cursor-pointer p-2 z-20 transition-colors"
          aria-label="Închide"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-6 md:p-10 custom-scrollbar flex-1">
          {loading || !product ? (
            <div className="h-96 flex items-center justify-center">
              <div className="w-6 h-6 border border-[var(--muted)] border-t-[var(--foreground)] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Full-width Product Title Header */}
              <div className="border-b border-[var(--border)] pb-6 pr-10">
                <h1 className="text-xl md:text-2xl lg:text-[28px] font-medium tracking-[0.06em] uppercase text-neutral-900 leading-snug">
                  {product.title}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* Product Image Column */}
                <div className="relative w-full aspect-[3/4] bg-[#F9F8F6] overflow-hidden border border-[var(--border)] select-none">
                  {product.featuredImage && (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      className="object-cover transition-transform duration-[1200ms] hover:scale-105"
                      sizes="(max-w-768px) 100vw, 450px"
                    />
                  )}
                </div>

                {/* BuyBox Column */}
                <div className="pt-0">
                  <BuyBox
                    title={product.title}
                    handle={product.handle}
                    options={product.options}
                    variants={product.variants.edges.map((e) => e.node)}
                    onAddToCartSuccess={closeQuickView}
                    showTitle={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

