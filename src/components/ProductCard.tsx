'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Star } from 'lucide-react'
import { useCart } from './CartProvider'
import { useUI } from './UIProvider'

type ProductNode = {
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
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading } = useCart()
  const { openQuickView } = useUI()

  const hasMultipleVariants = (product.variants?.edges?.length ?? 0) > 1
  const isAvailable = product.variants?.edges?.[0]?.node?.availableForSale ?? false
  const firstVariantId = product.variants?.edges?.[0]?.node?.id

  const handleQuickAdd = async () => {
    if (hasMultipleVariants) {
      // This case is now handled by the quick view modal
      return
    }
    if (!firstVariantId || !isAvailable) {
      console.error('Product is not available for purchase.')
      return
    }
    try {
      await addToCart(firstVariantId, 1)
    } catch (error) {
      console.error('Quick add failed:', error)
    }
  }

  const buttonClassName =
    'mt-2 w-full px-4 py-2 text-base font-medium rounded-md transition-colors'

  return (
    <div className="group relative bg-white rounded-lg hover:shadow-md transition-shadow flex flex-col">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="aspect-square overflow-hidden rounded-t-lg">
          {product.featuredImage?.url ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              width={600}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link href={`/products/${product.handle}`}>
            <h2 className="font-normal text-base leading-snug text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors">
              {product.title}
            </h2>
          </Link>

          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className="fill-yellow-400 text-yellow-400"
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">(4.5)</span>
          </div>
        </div>

        <div className="flex flex-col items-start mt-2">
          <div className="font-bold text-xl leading-[30px] text-[rgb(38,38,38)]">
            {product.priceRange?.minVariantPrice?.amount ? (
              <>
                {Number(product.priceRange.minVariantPrice.amount).toFixed(2)}
                <span className="text-sm text-gray-500 ml-1">
                  {product.priceRange.minVariantPrice.currencyCode === 'RON' || product.priceRange.minVariantPrice.currencyCode === 'LEI'
                    ? 'LEI'
                    : product.priceRange.minVariantPrice.currencyCode}
                </span>
              </>
            ) : (
              'Price unavailable'
            )}
          </div>

          {hasMultipleVariants ? (
            <button
              onClick={() => openQuickView({ handle: product.handle })}
              className={`${buttonClassName} bg-gray-800 text-white hover:bg-gray-900`}
              title="Selectează opțiuni"
            >
              Selectează opțiuni
            </button>
          ) : isAvailable ? (
            <button
              onClick={handleQuickAdd}
              disabled={loading}
              className={`${buttonClassName} bg-green-600 text-white hover:bg-green-700 cursor-pointer`}
              title="Adaugă în coș"
            >
              Adaugă în coș
            </button>
          ) : (
            <button
              disabled
              className={`${buttonClassName} bg-gray-300 text-gray-500 cursor-not-allowed`}
              title="Stoc epuizat"
            >
              Stoc epuizat
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

