'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, X, Minus, Plus } from 'lucide-react'
import { useCart } from './CartProvider'

type MobileStickyBuyBoxProps = {
  product: {
    title: string
    price: string
    currency: string
    availableForSale: boolean
  }
  variantId?: string
  loading?: boolean
}

export default function MobileStickyBuyBox({
  product,
  variantId,
  loading = false,
}: MobileStickyBuyBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { cart, addToCart } = useCart()
  const cartCount = cart?.totalQuantity || 0

  const handleAddToCart = async (qty: number) => {
    if (variantId) {
      await addToCart(variantId, qty)
    }
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {product.title}
            </div>
            <div className="text-lg font-bold text-green-600">
              {product.price} {product.currency}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-gray-600 hover:text-green-600"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleAddToCart(1)}
              disabled={!product.availableForSale || loading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                product.availableForSale && !loading
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Flyout */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add to Cart</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {product.title}
                </h4>
                <div className="text-2xl font-bold text-green-600">
                  {product.price} {product.currency}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border rounded-lg py-2"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleAddToCart(quantity)
                    setIsOpen(false)
                  }}
                  disabled={!product.availableForSale || loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    product.availableForSale && !loading
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Adding to Cart...' : `Add ${quantity} to Cart`}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
