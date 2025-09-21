'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  MapPin,
  Undo2, // Added for restore icon
  X, // Added for remove icon
} from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import ConfirmationModal from '@/components/ConfirmationModal'
import RelatedProducts from '@/components/RelatedProducts'
import AddressModal from '@/components/AddressModal'
import { useAuth } from '@/components/AuthProvider'
import DeliveryMethodSelector from '@/components/DeliveryMethodSelector'

export default function CartPage() {
  const {
    cart,
    loading,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    setSelectedDeliveryAddress,
    selectedDeliveryAddress,
    selectedDeliveryOption,
    setSelectedDeliveryOption,
    shippingCost,
    subtotal,
    total,
    recentlyRemovedItems, // Added
    restoreCartItem, // Added
    removeRecentlyRemovedItem, // Added
  } = useCart()

  const [isLoading, setIsLoading] = useState(true)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false)
  const [selectedItemsToRestore, setSelectedItemsToRestore] = useState<string[]>([]) // New state for multi-restore
  const { user } = useAuth()

  useEffect(() => {
    // CartProvider handles initial cart load
    setIsLoading(false)
  }, [])

  const handleClearCart = () => {
    clearCart()
    setIsClearCartModalOpen(false)
  }

  if (isLoading || !cart) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă coșul...</p>
        </div>
      </div>
    )
  }

  // Empty Cart State - Re-structured
  if (cart.lines.edges.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Coșul tău</h1> {/* Header */}
        
        {/* Security Message */}
        <div className="mb-8 p-4 bg-green-50 rounded-lg text-green-800 text-sm flex items-center justify-center gap-2">
          <ShieldCheck size={20} />
          <span>Protein Shop este securizat și detaliile tale personale sunt protejate.</span>
        </div>

        {/* Recently Removed Products */}
        {recentlyRemovedItems.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Produse șterse recent</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={async () => {
                  for (const itemId of selectedItemsToRestore) {
                    const itemToRestore = recentlyRemovedItems.find(item => item.id === itemId);
                    if (itemToRestore) {
                      await restoreCartItem(itemToRestore);
                    }
                  }
                  setSelectedItemsToRestore([]);
                }}
                disabled={loading || selectedItemsToRestore.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Undo2 size={16} />
                Restaurare selectate ({selectedItemsToRestore.length})
              </button>
              <button
                onClick={async () => {
                  for (const item of recentlyRemovedItems) {
                    await restoreCartItem(item);
                  }
                  setSelectedItemsToRestore([]);
                }}
                disabled={loading || recentlyRemovedItems.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Undo2 size={16} />
                Restaurare toate ({recentlyRemovedItems.length})
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {recentlyRemovedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItemsToRestore.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemsToRestore((prev) => [...prev, item.id]);
                        } else {
                          setSelectedItemsToRestore((prev) => prev.filter((id) => id !== item.id));
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                    />
                    {item.image?.url ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.altText || item.title}
                        width={64}
                        height={64}
                        className="object-contain rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded">
                        <ShoppingCart className="text-gray-400" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.title}{' '}
                        <span className="text-gray-500 text-sm">
                          tocmai a fost eliminat din coșul tău
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">Cantitate: {item.quantity}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRecentlyRemovedItem(item.id)}
                    disabled={loading}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Cart Message */}
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-6">
            <ShoppingCart size={48} className="mx-auto text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Coșul tău este gol
          </h2>
          <p className="text-gray-600 mb-6">
            Nu ai niciun produs în coș. Continuă cumpărăturile pentru a adăuga
            produse.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Continuă cumpărăturile</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Coșul Tău (
            {cart.totalQuantity === 1
              ? 'un produs'
              : `${cart.totalQuantity} produse`}
            )
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsClearCartModalOpen(true)} // Open confirmation modal
              disabled={loading}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors font-medium py-2 px-4 rounded-lg border border-red-600 cursor-pointer"
            >
              <Trash2 size={20} />
              Golește Coșul
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items & Related Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg divide-y divide-gray-200 mb-8">
            {cart.lines.edges.map(({ node: line }, index) => (
              <div key={line.id} className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0">
                    <Link
                      href={`/products/${line.merchandise.product.handle}`}
                      className="block w-full h-full"
                    >
                      {(line.merchandise.image?.url || line.merchandise.product.featuredImage?.url) ? (
                        <Image
                          src={line.merchandise.image?.url || line.merchandise.product.featuredImage?.url!}
                          alt={
                            line.merchandise.image?.altText ||
                            line.merchandise.product.featuredImage?.altText ||
                            line.merchandise.title
                          }
                          width={96}
                          height={96}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ShoppingCart className="text-gray-400" size={24} />
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      {/* Left: Title & SKU */}
                      <div className="flex-grow pr-4">
                        <Link
                          href={`/products/${line.merchandise.product.handle}`}
                          className="text-lg font-medium text-gray-900 hover:text-green-600"
                        >
                          {line.merchandise.product.title}
                        </Link>
                        {line.merchandise.sku && (
                          <p className="text-sm text-gray-500 mt-1">
                            SKU: {line.merchandise.sku}
                          </p>
                        )}
                        {/* Display selected options here */}
                        {line.merchandise.selectedOptions && line.merchandise.selectedOptions.length > 0 && (
                          // Filter out "Default Title" options
                          (() => {
                            const filteredOptions = line.merchandise.selectedOptions.filter(
                              (option) => option.value !== 'Default Title'
                            );
                            return filteredOptions.length > 0 ? (
                              <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                                {filteredOptions.map((option, optIndex) => (
                                  <p key={optIndex}>
                                    {option.name}: {option.value}
                                  </p>
                                ))}
                              </div>
                            ) : null;
                          })()
                        )}
                      </div>

                      {/* Middle: Quantity & Remove Action */}
                      <div className="flex flex-col items-center mx-4">
                        <div className="relative">
                          <select
                            value={line.quantity}
                            onChange={(e) =>
                              updateCartItemQuantity(
                                line.id,
                                parseInt(e.target.value, 10)
                              )
                            }
                            disabled={loading}
                            className="m-0 text-base appearance-none h-[42px] px-[15px] py-[11px] border border-gray-300 leading-4 bg-white rounded-[3px] pr-8"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(
                              (q) => (
                                <option key={q} value={q}>
                                  {q}
                                </option>
                              )
                            )}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(line.id)}
                          disabled={loading}
                          className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer text-base leading-6 mt-2"
                        >
                          Șterge
                        </button>
                      </div>

                      {/* Right: Price */}
                      <div className="text-lg font-medium text-gray-900 w-32 text-right pl-4">
                        {(
                          parseFloat(line.merchandise.price.amount) *
                          line.quantity
                        ).toFixed(2)}{' '}
                        {line.merchandise.price.currencyCode === 'RON' ? 'LEI' : line.merchandise.price.currencyCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-6">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6">
              <Sparkles size={24} className="text-yellow-500" />
              <span>Poate te gândeai și la...</span>
            </h2>
            <RelatedProducts />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sumar Comandă
            </h2>

            {/* Step 1: Subtotal */}
            <div className="mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal ({cart.totalQuantity}{' '}
                  {cart.totalQuantity === 1 ? 'produs' : 'produse'})
                </span>
                <span className="font-medium">
                  {subtotal.toFixed(2)} {cart.cost.subtotalAmount.currencyCode === 'RON' ? 'LEI' : cart.cost.subtotalAmount.currencyCode}
                </span>
              </div>
            </div>

            {/* Step 2: Address Selection */}
            {user && (
              <div className="mb-6">
                {/* Address Selection Button */}
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                    1
                  </span>
                  Adresa de livrare
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedDeliveryAddress
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <MapPin size={20} />
                  {selectedDeliveryAddress
                    ? 'Modifică adresa de livrare'
                    : 'Selectează adresa de livrare'}
                </button>

                {/* Selected Address Display */}
                {selectedDeliveryAddress && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-2">
                    <div className="space-y-1 text-gray-600">
                      <p className="font-medium">
                        {selectedDeliveryAddress.firstName}{' '}
                        {selectedDeliveryAddress.lastName}
                      </p>
                      {selectedDeliveryAddress.company && (
                        <p className="text-gray-500">
                          {selectedDeliveryAddress.company}
                        </p>
                      )}
                      <p>{selectedDeliveryAddress.address1}</p>
                      {selectedDeliveryAddress.address2 && (
                        <p>{selectedDeliveryAddress.address2}</p>
                      )}
                      <p>
                        {selectedDeliveryAddress.city},{' '}
                        {selectedDeliveryAddress.province}{' '}
                        {selectedDeliveryAddress.zip}
                      </p>
                      {selectedDeliveryAddress.country &&
                        selectedDeliveryAddress.country.trim().toLowerCase() !== 'romania' && (
                          <p>{selectedDeliveryAddress.country}</p>
                        )}
                      {selectedDeliveryAddress.phone && (
                        <p>
                          <span className="font-medium">Tel:</span>{' '}
                          {selectedDeliveryAddress.phone}
                        </p>
                      )}
                    </div>

                    {/* Step 3: Delivery Method - Only shown if address is selected */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                          2
                        </span>
                        Metoda de livrare
                      </h3>
                      <DeliveryMethodSelector
                        options={
                          cart.deliveryGroups.edges[0]?.node.deliveryOptions ||
                          []
                        }
                        selectedOptionHandle={
                          selectedDeliveryOption?.handle || null
                        }
                        onSelect={(handle: string) => {
                          const option =
                            (
                              cart.deliveryGroups.edges[0]?.node
                                .deliveryOptions || []
                            ).find((o: any) => o.handle === handle) || null
                          setSelectedDeliveryOption(option)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Cost Summary */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cost livrare</span>
                {shippingCost === 0 ? (
                  <span className="font-medium text-green-600">Gratuit</span>
                ) : (
                  <span className="font-medium">
                    {shippingCost.toFixed(2)}{' '}
                    {cart.cost.subtotalAmount.currencyCode === 'RON' ? 'LEI' : cart.cost.subtotalAmount.currencyCode}
                  </span>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total comandă</span>
                  <span>
                    {total.toFixed(2)} {cart.cost.totalAmount.currencyCode === 'RON' ? 'LEI' : cart.cost.totalAmount.currencyCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={cart.checkoutUrl}
                className={`w-full py-3 px-4 rounded-lg text-center block font-medium transition-all ${
                  user && !selectedDeliveryAddress
                    ? 'border border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={(e) => {
                  if (user && !selectedDeliveryAddress) {
                    e.preventDefault()
                    setIsAddressModalOpen(true)
                  }
                }}
              >
                Finalizează Comanda
              </Link>
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center block font-medium"
              >
                Continuă cumpărăturile
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="text-green-600" size={20} />
                <span>Plată securizată prin Shopify</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        mode="shipping"
        onAddressSelect={async (address) => {
          try {
            await setSelectedDeliveryAddress(address)
            setIsAddressModalOpen(false)
          } catch (error) {
            console.error('Failed to update delivery address:', error)
          }
        }}
      />

      <ConfirmationModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={handleClearCart}
        message="Ești sigur că vrei să golești coșul? Această acțiune este ireversibilă."
        title="Confirmă golirea coșului"
      />
    </div>
  )
}