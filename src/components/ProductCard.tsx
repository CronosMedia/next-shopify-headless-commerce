'use client'
import Image from 'next/image'
import Link from 'next/link'

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
    edges: {
      node: {
        id: string
        availableForSale: boolean
      }
    }[]
  }
}

type ProductCardProps = {
  product: ProductNode
  isLCP?: boolean
}

export default function ProductCard({ product, isLCP }: ProductCardProps) {
  const isAvailable = product.variants?.edges?.[0]?.node?.availableForSale ?? false

  const price = product.priceRange?.minVariantPrice?.amount
    ? Number(product.priceRange.minVariantPrice.amount).toFixed(2)
    : null
  return (
    <div className="group relative flex flex-col h-full bg-white">
      {/* Image Container with subtle zoom */}
      <Link href={`/products/${product.handle}`} className="block relative overflow-hidden aspect-[3/4]">
        <div className="w-full h-full bg-[#F9F8F6]">
          {product.featuredImage?.url ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              width={800}
              height={1067}
              className="w-full h-full object-cover transition-all duration-[1500ms] ease-out group-hover:scale-105"
              {...(isLCP && { priority: true })}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#a0a0a0]">Maison</span>
            </div>
          )}
        </div>

        {/* Subtle hover state indication (no buttons for pure luxury) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-500" />

        {/* Out of Stock Label */}
        {!isAvailable && (
          <div className="absolute top-4 left-4">
            <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#1a1a1a] bg-white/90 px-3 py-1.5 backdrop-blur-sm">
              Archived
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="pt-5 pb-2 flex flex-col items-start px-1">
        {/* Vendor/Brand */}
        {product.vendor && (
          <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#1a1a1a] mb-2">
            {product.vendor}
          </span>
        )}

        {/* Title */}
        <Link href={`/products/${product.handle}`} className="block w-full">
          <h2 className="text-[13px] font-normal leading-relaxed text-[#4a4a4a] tracking-wide truncate hover:text-black transition-colors">
            {product.title}
          </h2>
        </Link>

        {/* Price */}
        <div className="mt-2.5">
          {price ? (
            <span className="text-[13px] font-medium tracking-wide text-[#1a1a1a]">
              £{price}
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#8a8a8a]">By Inquiry</span>
          )}
        </div>
      </div>
    </div>
  )
}
