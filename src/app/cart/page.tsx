'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Undo2, // Added for restore icon
  X, // Added for remove icon
  Minus,
  Plus,
} from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import ConfirmationModal from '@/components/ConfirmationModal'
import RelatedProducts from '@/components/RelatedProducts'
import AddressModal from '@/components/AddressModal'
import { useAuth } from '@/components/AuthProvider'
import DeliveryMethodSelector from '@/components/DeliveryMethodSelector'
import { formatMoney } from '@/lib/utils'

export default function CartPage() {
  const {
    cart,
    loading,
    setError,
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
  const currencyCode = cart?.cost?.subtotalAmount?.currencyCode || 'RON'

  useEffect(() => {
    // CartProvider handles initial cart load
    setIsLoading(false)
  }, [])

  const handleClearCart = () => {
    clearCart()
    setIsClearCartModalOpen(false)
  }

  if (isLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă coșul...</p>
        </div>
      </div>
    )
  }

  // Empty Cart State - Re-structured
  if (!cart || cart.lines.edges.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Coșul tău</h1> {/* Header */}

        {/* Security Message */}
        <div className="mb-8 p-4 bg-secondary border border-border rounded-lg text-foreground text-sm flex items-center justify-center gap-2">
          <ShieldCheck size={20} className="text-accent" />
          <span>Maison Outdoor este securizat și detaliile tale personale sunt protejate.</span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-base font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-base font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                      className="form-checkbox h-4 w-4 text-accent border-border transition duration-150 ease-in-out"
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
            className="inline-flex items-center gap-2 bg-primary text-white hover:opacity-90 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Continuă cumpărăturile</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
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
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors font-medium py-2 px-4 rounded-lg border border-red-600 cursor-pointer text-sm sm:text-base w-full sm:w-auto justify-center"
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
          <div className="bg-white rounded-lg divide-y divide-gray-200 mb-8 border border-[var(--border)] shadow-sm">
            {cart.lines.edges.map(({node: line}) => (
              <div key={line.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Product Image & Mobile Info Header */}
                  <div className="flex gap-4 sm:block">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-secondary rounded-md overflow-hidden">
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        className="block w-full h-full"
                      >
                        {(line.merchandise.image?.url || line.merchandise.product.featuredImage?.url) ? (
                          <Image
                            src={
                              line.merchandise.image?.url ??
                              line.merchandise.product.featuredImage?.url ??
                              ''
                            }
                            alt={
                              line.merchandise.image?.altText ||
                              line.merchandise.product.featuredImage?.altText ||
                              line.merchandise.title
                            }
                            width={100}
                            height={100}
                            priority={true}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No Image
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Mobile Title (shows next to image on small screens) */}
                    <div className="flex-1 min-w-0 sm:hidden">
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        className="text-base font-medium text-gray-900 hover:text-accent line-clamp-2"
                      >
                        {line.merchandise.product.title}
                      </Link>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {formatMoney(parseFloat(line.merchandise.price.amount) * line.quantity, currencyCode)}
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      {/* Left: Desktop Title & Options */}
                      <div className="flex-grow pr-0 sm:pr-4">
                        <Link
                          href={`/products/${line.merchandise.product.handle}`}
                          className="hidden sm:block text-lg font-medium text-gray-900 hover:text-accent"
                        >
                          {line.merchandise.product.title}
                        </Link>
                        {line.merchandise.sku && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
                              <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-0.5">
                                {filteredOptions.map((option, optIndex) => (
                                  <p key={optIndex}>
                                    <span className="text-gray-400">{option.name}:</span> {option.value}
                                  </p>
                                ))}
                              </div>
                            ) : null;
                          })()
                        )}
                      </div>

                      {/* Right: Actions & Price */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-100 sm:border-0">
                        {/* Quantity & Delete */}
                        <div className="flex items-center sm:flex-col sm:mx-4 gap-4 sm:gap-0">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50 p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                if (line.quantity > 1) {
                                  updateCartItemQuantity(line.id, line.quantity - 1)
                                } else {
                                  removeFromCart(line.id)
                                }
                              }}
                              disabled={loading}
                              className="w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:text-accent hover:bg-white active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <span className="w-10 text-center text-sm font-medium text-gray-800 select-none">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(line.id, line.quantity + 1)}
                              disabled={loading}
                              className="w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:text-accent hover:bg-white active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(line.id)}
                            disabled={loading}
                            className="font-medium text-gray-400 hover:text-accent underline cursor-pointer text-sm sm:text-base sm:mt-2 transition-colors"
                          >
                            Șterge
                          </button>
                        </div>

                        {/* Desktop Price */}
                        <div className="hidden sm:block text-lg font-medium text-gray-900 w-32 text-right pl-4">
                          {formatMoney(parseFloat(line.merchandise.price.amount) * line.quantity, currencyCode)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-6">
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
                  {formatMoney(subtotal, currencyCode)}
                </span>
              </div>
            </div>

            {/* Step 2: Address Selection */}
            {user && (
              <div className="mb-6">
                {/* Address Selection Button */}
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-primary border border-border text-sm font-semibold">
                    1
                  </span>
                  Adresa de livrare
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${selectedDeliveryAddress
                    ? 'border border-border text-foreground hover:bg-secondary'
                    : 'bg-primary text-white hover:opacity-90'
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
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-primary border border-border text-sm font-semibold">
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
                            ).find((option) => option.handle === handle) || null
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
                  <span className="font-medium text-accent">Gratuit</span>
                ) : (
                  <span className="font-medium">
                    {formatMoney(shippingCost, currencyCode)}
                  </span>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total comandă</span>
                  <span>
                    {formatMoney(total, currencyCode)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={cart.checkoutUrl}
                className={`w-full py-3 px-4 rounded-lg text-center block font-medium transition-all ${user && !selectedDeliveryAddress
                  ? 'border border-border text-muted-foreground bg-secondary cursor-not-allowed'
                  : 'bg-accent text-white hover:opacity-90'
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
                className="w-full border border-border text-foreground py-3 px-4 rounded-lg hover:bg-secondary transition-colors text-center block font-medium"
              >
                Continuă cumpărăturile
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="text-accent" size={20} />
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
          } catch {
            setError('Adresa de livrare nu a putut fi actualizată.')
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
