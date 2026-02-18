'use client'
import { useMemo, useState, useEffect } from 'react'
import { useCart } from '@/components/CartProvider'
import { Minus, Plus, ShoppingCart, CreditCard } from 'lucide-react'
import Swatch from './Swatch' // Import the new Swatch component
import WishlistButton from '@/components/WishlistButton'

type Option = { name: string; values: string[] }
export type Variant = {
  id: string
  title: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  compareAtPrice?: { amount: string; currencyCode: string } | null
  image?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  selectedOptions: { name: string; value: string }[]
  metafield?: { value: string } | null; // Add metafield to Variant type
}

export default function BuyBox({
  title,
  options,
  variants,
  onVariantChange,
  onAddToCartSuccess,
}: {
  title: string
  options: Option[]
  variants: Variant[]
  onVariantChange?: (variant: Variant) => void
  onAddToCartSuccess?: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    options?.forEach((o) => {
      initial[o.name] = o.values?.[0] || ''
    })
    return initial
  })

  const selectedVariant = useMemo(() => {
    return (
      variants.find((v) =>
        v.selectedOptions.every((o) => selection[o.name] === o.value)
      ) || variants[0]
    )
  }, [selection, variants])

  useEffect(() => {
    if (selectedVariant) {
      onVariantChange?.(selectedVariant)
    }
  }, [selectedVariant, onVariantChange])

  const canAdd = selectedVariant?.availableForSale && quantity > 0
  const { addToCart, loading } = useCart()

  const handleAddToCart = async () => {
    try {
      await addToCart(selectedVariant.id, quantity)
      console.log('BuyBox: onAddToCartSuccess called.')
      onAddToCartSuccess?.()
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  return (
    <div className="space-y-16">
      {/* Product Info Group */}
      <div>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <div className="mt-2">

            </div>
          </div>
        </div>

        {variants.length > 1 ? (
          <div className="space-y-4">
            {options.map((opt) => (
              <div key={opt.name} className="space-y-2">
                {opt.name !== 'Title' && <div className="text-sm font-medium">{opt.name}</div>}
                <div className="flex flex-wrap gap-3">
                  {opt.values.map((val) => {
                    const variantForSwatch = variants.find(v =>
                      v.selectedOptions.some(so => so.name === opt.name && so.value === val)
                    );
                    const swatchMetafield = variantForSwatch?.metafield;

                    return (
                      <Swatch
                        key={val}
                        name={opt.name}
                        value={val}
                        active={selection[opt.name] === val}
                        onClick={() =>
                          setSelection((s) => ({ ...s, [opt.name]: val }))
                        }
                        metafield={swatchMetafield} // Pass the metafield here
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Price & Add to Cart Group */}
      <div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">
              {Number(selectedVariant?.price.amount || 0).toFixed(2)}{' '}
              {selectedVariant?.price.currencyCode}
            </span>
            {selectedVariant?.compareAtPrice?.amount ? (
              <span className="text-sm line-through text-gray-500">
                {Number(selectedVariant.compareAtPrice.amount).toFixed(2)}{' '}
                {selectedVariant.compareAtPrice.currencyCode}
              </span>
            ) : null}
          </div>
          {!selectedVariant?.availableForSale ? (
            <div className="text-sm text-red-600">Stoc epuizat</div>
          ) : (
            <div className="text-sm text-green-600">În stoc</div>
          )}
        </div>

        <div className="flex gap-3 mt-8 h-12">
          {/* Quantity - Square Box Style */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-white shrink-0 h-full">
            <button
              className="px-3 h-full hover:bg-gray-50 hover:text-black text-gray-500 transition-colors"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Scade cantitatea"
            >
              <Minus size={16} />
            </button>
            <input
              className="w-10 text-center h-full outline-none font-medium text-gray-900 appearance-none m-0 bg-transparent"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <button
              className="px-3 h-full hover:bg-gray-50 hover:text-black text-gray-500 transition-colors"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Crește cantitatea"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to Cart - Dominant Button */}
          <button
            disabled={!canAdd}
            className={`flex-1 h-full px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${canAdd
                ? 'bg-black hover:bg-gray-900 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            onClick={handleAddToCart}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>Adaugă în coș</span>
              </>
            )}
          </button>

          {/* Wishlist - Icon Box */}
          <div className="h-full">
            <WishlistButton
              item={{
                id: selectedVariant.id,
                handle: '',
                title: title,
                featuredImage: selectedVariant.image ? {
                  url: selectedVariant.image.url,
                  altText: selectedVariant.image.altText || undefined
                } : null,
                priceRange: {
                  minVariantPrice: selectedVariant.price
                }
              }}
              variant="icon"
              className="h-full w-12 !p-0"
            />
          </div>
        </div>

        {/* Payment & Trust Badges - Clean & Aligned Left */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">

          {/* Simple Payment Indicator */}
          <div className="flex items-center gap-2 text-gray-600">
            <div className="p-1.5 bg-gray-50 rounded text-gray-500">
              <CreditCard size={18} />
            </div>
            <span className="text-sm font-medium">Plată 100% securizată</span>
            <span className="text-xs text-gray-400 ml-1">(SSL Encrypted)</span>
          </div>

          {/* Value Props - Simple List */}
          <ul className="space-y-3 pt-2">
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="mt-0.5 text-green-600 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Livrare rapidă (24-48h) prin curier rapid</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="mt-0.5 text-green-600 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Transport gratuit la comenzi peste 200 LEI</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="mt-0.5 text-green-600 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Garanție de retur în 30 de zile</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
