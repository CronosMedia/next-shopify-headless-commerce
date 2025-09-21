'use client'
import { useMemo, useState, useEffect } from 'react'
import { useCart } from '@/components/CartProvider'
import { Minus, Plus, ShoppingCart, CreditCard } from 'lucide-react'
import Swatch from './Swatch' // Import the new Swatch component

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

        <div className="flex items-center gap-3 mt-6">
          <div className="flex items-center border rounded">
            <button
              className="px-3 h-10"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Scade cantitatea"
            >
              <Minus size={16} />
            </button>
            <input
              className="w-12 text-center h-10 outline-none"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <button
              className="px-3 h-10"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Crește cantitatea"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            disabled={!canAdd}
            className={`h-10 px-5 rounded text-white flex items-center justify-center gap-2 ${
              canAdd ? 'bg-black' : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleAddToCart}
          >
            {loading ? (
              'Se adaugă…'
            ) : (
              <>
                <ShoppingCart size={20} />
                Adaugă în coș
              </>
            )}
          </button>
        </div>

        {/* Payment & Shipping/Returns Info */}
        <div className="mt-6 space-y-3 text-center">
          <div className="flex items-center justify-center gap-4 text-gray-600">
            <CreditCard size={24} />
            <span className="text-sm">Plăți sigure</span>
          </div>
          <p className="text-sm text-gray-600">
            Livrare gratuită la comenzi peste 200 LEI. Retururi gratuite în 30 de zile.
          </p>
        </div>
      </div>
    </div>
  )
}
