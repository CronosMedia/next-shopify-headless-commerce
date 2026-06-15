'use client'
import { useMemo, useState, useEffect } from 'react'
import { useCart } from '@/components/CartProvider'
import {Minus, Plus} from 'lucide-react'
import Swatch from './Swatch' // Import the new Swatch component
import WishlistButton from '@/components/WishlistButton'
import { formatMoney } from '@/lib/utils'

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
  handle,
  options,
  variants,
  onVariantChange,
  onAddToCartSuccess,
}: {
  title: string
  handle: string
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
      onAddToCartSuccess?.()
    } catch {
      return
    }
  }

  return (
    <div className="space-y-12">
      {/* Product Information */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-[#1a1a1a] leading-tight">
          {title}
        </h1>
        <div className="flex items-baseline gap-4 pt-2">
          <span className="text-xl font-light text-[#1a1a1a]">
            {formatMoney(selectedVariant?.price.amount || 0, selectedVariant?.price.currencyCode)}
          </span>
          {selectedVariant?.compareAtPrice?.amount ? (
            <span className="text-sm line-through text-[#8a8a8a] font-light">
              {formatMoney(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Variant Selection */}
      {variants.length > 1 ? (
        <div className="space-y-10 pt-4">
          {options.map((opt) => (
            <div key={opt.name} className="space-y-4">
              {opt.name !== 'Title' && (
                <div className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#8a8a8a]">
                  Select {opt.name}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
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
                      metafield={swatchMetafield}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Purchase Actions */}
      <div className="pt-8 space-y-8">
        <div className="flex flex-col gap-8">
          {/* Quantity Selector - Minimalist Luxury */}
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8a8a8a]">Quantity</span>
            <div className="flex items-center border border-[#e5e4e0] rounded-sm">
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f9f8f6] transition-colors"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={14} className="text-[#1a1a1a]" />
              </button>
              <input
                className="w-10 text-center outline-none text-sm font-light bg-transparent"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f9f8f6] transition-colors"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={14} className="text-[#1a1a1a]" />
              </button>
            </div>
          </div>

          {/* Add to Bag - Solid Coherent Button */}
          <button
            disabled={!canAdd}
            className={`w-full group h-14 flex items-center justify-center text-[12px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ${canAdd
              ? 'bg-[#1a1a1a] text-white hover:bg-[#333333]'
              : 'bg-[#f0efed] text-[#cbcbcb] cursor-not-allowed'
              }`}
            onClick={handleAddToCart}
          >
            <span>
              {loading ? 'Adding...' : selectedVariant?.availableForSale ? 'Add to Bag' : 'Out of Stock'}
            </span>
          </button>

          <div className="flex justify-start">
            <WishlistButton
              item={{
                id: selectedVariant?.id,
                handle: handle,
                title: title,
                featuredImage: selectedVariant?.image ? {
                  url: selectedVariant.image.url,
                  altText: selectedVariant.image.altText || undefined
                } : null,
                priceRange: {
                  minVariantPrice: selectedVariant?.price
                }
              }}
              variant="icon"
              className="text-[#8a8a8a] hover:text-[#1a1a1a] transition-colors p-0"
            />
          </div>
        </div>

        {/* Product Highlights / Useful Info */}
        <div className="pt-8 space-y-6 border-t border-[#f0efed]">
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">Product Highlights</h4>
            <ul className="space-y-3">
              {[
                { label: 'Craftsmanship', value: 'Handcrafted in limited runs' },
                { label: 'Sustainability', value: '100% recycled core materials' },
                { label: 'Warranty', value: '2-year limited manufacturer warranty' }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#8a8a8a]">{item.label}</span>
                  <span className="text-[11px] text-[#4a4a4a] text-right">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[10px] font-normal leading-relaxed text-[#b1b1b1] tracking-wider max-w-xs">
            Complimentary shipping on all orders over £200.
            Estimated delivery 2-4 business days.
          </div>
        </div>
      </div>
    </div>
  )
}
