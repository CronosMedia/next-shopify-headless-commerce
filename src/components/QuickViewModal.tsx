'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/components/UIProvider'
import type { QuickViewProduct } from '@/components/UIProvider'
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

function QuickViewSkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%] animate-pulse ${className}`}
    />
  )
}

function QuickViewSkeletonOption({
  option,
}: {
  option: { name: string; values: string[] }
}) {
  const values = option.values.slice(0, 4)
  const isColorOption = /colou?r|culoare/i.test(option.name)

  return (
    <div className="space-y-3.5">
      <QuickViewSkeletonBlock className="h-3 w-32" />
      <div className={isColorOption ? 'flex flex-wrap gap-4' : 'flex flex-wrap gap-3'}>
        {values.map((value, index) => (
          <QuickViewSkeletonBlock
            key={`${option.name}-${value}-${index}`}
            className={
              isColorOption
                ? 'h-10 w-10 border border-neutral-200'
                : 'h-11 w-16 border border-neutral-200 md:w-20'
            }
          />
        ))}
      </div>
    </div>
  )
}

function QuickViewSkeleton({ previewProduct }: { previewProduct: QuickViewProduct }) {
  const optionSkeletons = (previewProduct.options || []).filter(
    (option) => option.name !== 'Title' && option.values.length > 1
  )
  const hasMetadata = Boolean(previewProduct.vendor || previewProduct.productType)
  const shouldShowVariantFallback =
    optionSkeletons.length === 0 && (previewProduct.variantCount || 0) > 1

  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="border-b border-[var(--border)] pb-6 pr-10 space-y-3">
        {hasMetadata ? <QuickViewSkeletonBlock className="h-3 w-28" /> : null}
        <QuickViewSkeletonBlock className="h-14 md:h-10 w-full max-w-[560px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="relative w-full aspect-[3/4] bg-[#F9F8F6] overflow-hidden border border-[var(--border)] select-none">
          <QuickViewSkeletonBlock className="absolute inset-0" />
        </div>

        <div className="pt-0 space-y-10">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <QuickViewSkeletonBlock className="h-8 md:h-9 w-32" />
              <QuickViewSkeletonBlock className="h-5 w-20" />
            </div>
            <QuickViewSkeletonBlock className="h-3 w-24" />
          </div>

          {optionSkeletons.length > 0 || shouldShowVariantFallback ? (
            <div className="space-y-8 pt-2">
              {optionSkeletons.map((option) => (
                <QuickViewSkeletonOption key={option.name} option={option} />
              ))}

              {shouldShowVariantFallback ? (
                <QuickViewSkeletonOption
                  option={{
                    name: 'Variantă',
                    values: Array.from(
                      { length: Math.min(previewProduct.variantCount || 2, 4) },
                      (_, index) => `variant-${index}`
                    ),
                  }}
                />
              ) : null}
            </div>
          ) : null}

          <div className="pt-6 space-y-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <QuickViewSkeletonBlock className="h-3 w-24" />
                <div className="flex items-center border border-[var(--border)] bg-white">
                  <QuickViewSkeletonBlock className="h-10 w-10" />
                  <QuickViewSkeletonBlock className="h-10 w-10" />
                  <QuickViewSkeletonBlock className="h-10 w-10" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <QuickViewSkeletonBlock className="h-14 w-full" />
                <QuickViewSkeletonBlock className="h-12 w-full border border-neutral-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
            <QuickViewSkeleton previewProduct={quickViewProduct} />
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
