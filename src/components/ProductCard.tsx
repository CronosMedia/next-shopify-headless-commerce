'use client'
import Image from 'next/image'
import Link from 'next/link'
import { formatMoney, cn } from '@/lib/utils'
import { useUI } from '@/components/UIProvider'
import { useWishlist } from '@/components/WishlistProvider'
import { Heart } from 'lucide-react'

type ProductNode = {
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
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
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

type ProductCardProps = {
  product: ProductNode
  isLCP?: boolean
}

export default function ProductCard({ product, isLCP }: ProductCardProps) {
  const isAvailable = product.variants?.edges?.[0]?.node?.availableForSale ?? false
  const { openQuickView } = useUI()
  const { isInWishlist, toggleItem } = useWishlist()
  const isSaved = isInWishlist(product.id)

  const price = product.priceRange?.minVariantPrice?.amount
    ? Number(product.priceRange.minVariantPrice.amount).toFixed(2)
    : null

  const wishlistItem = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: product.featuredImage ? {
      url: product.featuredImage.url,
      altText: product.featuredImage.altText || undefined
    } : null,
    priceRange: product.priceRange
  }

  return (
    <div className="group relative flex flex-col h-full bg-white">
      {/* Image Container with subtle zoom */}
      <div className="relative overflow-hidden aspect-[3/4]">
        <Link href={`/products/${product.handle}`} className="block w-full h-full">
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
        </Link>

        {/* Subtle hover state indication */}
        <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/[0.01] transition-colors duration-500" />

        {/* Previzualizare (Quick View) Button for Desktop */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openQuickView({
              handle: product.handle,
              vendor: product.vendor,
              productType: product.productType,
              options: product.options,
              variantCount: product.variants?.edges.length,
            })
          }}
          className="absolute bottom-0 left-0 right-0 bg-white/90 text-black text-[10px] font-semibold tracking-[0.25em] uppercase py-4 text-center border-t border-x-0 border-b-0 border-[var(--border)] focus:outline-none focus-visible:outline-none backdrop-blur-xs transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black hover:text-white hover:border-black cursor-pointer hidden lg:block"
        >
          Previzualizare
        </button>

        {/* Out of Stock Label */}
        {!isAvailable && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#1a1a1a] bg-white/90 px-3 py-1.5 backdrop-blur-sm">
              Stoc Epuizat
            </span>
          </div>
        )}

        {/* Wishlist Heart Button - Top Right (Floating) */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleItem(wishlistItem)
          }}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-transparent border-0 outline-none cursor-pointer hover:scale-110 active:scale-90 transition-all duration-300 p-0"
          aria-label={isSaved ? 'Elimină de la favorite' : 'Adaugă la favorite'}
        >
          <Heart
            size={22}
            className={cn(
              "transition-all duration-300 stroke-[1.5px]",
              isSaved
                ? "text-red-500 fill-red-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                : "text-white fill-black/10 hover:text-red-500 hover:fill-red-500/10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
            )}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="pt-4 pb-3 flex flex-col items-start px-0.5">
        {/* Vendor/Brand */}
        {product.vendor && (
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-neutral-400 mb-1.5">
            {product.vendor}
          </span>
        )}

        {/* Title */}
        <Link href={`/products/${product.handle}`} className="block w-full">
          <h2 className="text-[13px] md:text-sm font-light leading-relaxed text-neutral-800 tracking-wide truncate hover:text-black transition-colors duration-300">
            {product.title}
          </h2>
        </Link>

        {/* Price */}
        <div className="mt-1.5">
          {price && product.priceRange?.minVariantPrice ? (
            <span className="text-sm font-semibold tracking-wide text-neutral-900">
              {formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
            </span>
          ) : (
            <span className="text-xs uppercase tracking-[0.1em] text-neutral-400">La cerere</span>
          )}
        </div>
      </div>
    </div>
  )
}
