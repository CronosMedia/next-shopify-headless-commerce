'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  X, // Added for remove icon
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import ConfirmationModal from '@/components/ConfirmationModal'
import RelatedProducts from '@/components/RelatedProducts'
import AddressModal from '@/components/AddressModal'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/ToastProvider'
import DeliveryMethodSelector from '@/components/DeliveryMethodSelector'
import { formatMoney } from '@/lib/utils'
import { SearchableSelect } from '@/components/common/SearchableSelect'
import {
  getCanonicalCounty,
  getCanonicalLocality,
  getLocalitiesForCounty,
  getPostalCodeForCountyAndLocality,
  RO_COUNTIES,
} from '@/lib/ro-address'

type BillingType = 'personal' | 'business'

interface BillingProfile {
  id?: string
  alias: string
  type: BillingType
  firstName?: string
  lastName?: string
  companyName?: string
  cui?: string
  regCom?: string
  address: string
  city: string
  province: string
  zip: string
  phone: string
  isVatPayer?: boolean
  isEInvoiceActive?: boolean
}

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
    setSelectedBillingAddress,
    setSelectedDeliveryOption,
    selectedDeliveryOption,
    shippingCost,
    subtotal,
    total,
    recentlyRemovedItems, // Added
    restoreCartItem, // Added
    removeRecentlyRemovedItem, // Added
  } = useCart()

  const [hasMounted, setHasMounted] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressModalMode, setAddressModalMode] = useState<'shipping' | 'billing'>('shipping')
  const [sameBillingAddress, setSameBillingAddress] = useState(true)
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false)
  const [selectedItemsToRestore, setSelectedItemsToRestore] = useState<string[]>([]) // New state for multi-restore
  const [cachedLineCount, setCachedLineCount] = useState<number>(2)
  const { user } = useAuth()
  const { showToast } = useToast()
  const currencyCode = cart?.cost?.subtotalAmount?.currencyCode || 'RON'

  const [billingProfiles, setBillingProfiles] = useState<BillingProfile[]>([])
  const [selectedBillingProfileId, setSelectedBillingProfileId] = useState<string>('')
  const [isAnafLoading, setIsAnafLoading] = useState(false)
  const [customBillingError, setCustomBillingError] = useState<string | null>(null)
  const [isDeleteBillingProfileModalOpen, setIsDeleteBillingProfileModalOpen] = useState(false)
  const [billingProfileIdToDelete, setBillingProfileIdToDelete] = useState<string | null>(null)
  const [customBilling, setCustomBilling] = useState<BillingProfile>({
    alias: '',
    type: 'personal',
    firstName: '',
    lastName: '',
    companyName: '',
    cui: '',
    regCom: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    phone: '',
    isVatPayer: false,
    isEInvoiceActive: false,
  })

  useEffect(() => {
    setHasMounted(true)
    if (typeof window !== 'undefined') {
      const count = localStorage.getItem('cartLineCount')
      if (count) {
        const parsed = parseInt(count, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setCachedLineCount(parsed)
        }
      }
    }
  }, [])

  // Load customer billing profiles
  useEffect(() => {
    const loadProfiles = async () => {
      let profilesList: BillingProfile[] = []
      try {
        const res = await fetch('/api/account/billing')
        if (res.ok) {
          const data = await res.json()
          profilesList = data.billingProfiles || []
        }
      } catch {
        // Quietly fail and fallback
      }

      if (profilesList.length === 0) {
        const local = localStorage.getItem('local_billing_profiles')
        if (local) {
          try {
            profilesList = JSON.parse(local)
          } catch {
            profilesList = []
          }
        }
      }

      setBillingProfiles(profilesList)
      if (profilesList.length > 0) {
        setSelectedBillingProfileId(profilesList[0].id || '')
      }
    }

    if (user) {
      loadProfiles()
    }
  }, [user])

  const handleDeleteBillingProfile = async () => {
    if (!billingProfileIdToDelete) return
    const id = billingProfileIdToDelete
    setIsDeleteBillingProfileModalOpen(false)
    setBillingProfileIdToDelete(null)
    try {
      const res = await fetch('/api/account/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          profileId: id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Eroare la ștergere.')

      showToast('Profilul de facturare a fost șters.')
      const updated = data.billingProfiles || []
      setBillingProfiles(updated)
      if (selectedBillingProfileId === id) {
        setSelectedBillingProfileId(updated[0]?.id || 'new')
      }
    } catch {
      // Fallback: Delete from localStorage
      const nextProfiles = billingProfiles.filter((p) => p.id !== id)
      localStorage.setItem('local_billing_profiles', JSON.stringify(nextProfiles))
      setBillingProfiles(nextProfiles)
      showToast('Profilul de facturare a fost șters.')
      if (selectedBillingProfileId === id) {
        setSelectedBillingProfileId(nextProfiles[0]?.id || 'new')
      }
    }
  }

  const updateCartBillingAttributes = useCallback(async (
    isSame: boolean,
    profileId?: string,
    customProfile?: BillingProfile
  ) => {
    if (!cart?.id) return

    let attrs: { key: string; value: string }[] = []

    if (isSame) {
      attrs = [
        { key: 'Factură solicitată', value: 'Da' },
        { key: 'Facturare pe firmă', value: 'Nu' },
        { key: 'Tip Facturare', value: 'Persoană Fizică (Adresă Livrare)' },
      ]
    } else {
      let active: BillingProfile | null = null
      if (user && profileId && profileId !== 'new') {
        active = billingProfiles.find((p) => p.id === profileId) || null
      } else if (customProfile) {
        active = customProfile
      }

      if (active) {
        attrs = [
          { key: 'Factură solicitată', value: 'Da' },
          { key: 'Tip Facturare', value: active.type === 'personal' ? 'Persoană Fizică' : 'Persoană Juridică' },
          { key: 'Facturare pe firmă', value: active.type === 'business' ? 'Da' : 'Nu' },
        ]

        if (active.type === 'personal') {
          attrs.push({ key: 'Nume Facturare', value: `${active.firstName || ''} ${active.lastName || ''}` })
        } else {
          attrs.push({ key: 'Denumire Firmă', value: active.companyName || '' })
          attrs.push({ key: 'Cod Unic de Înregistrare (CUI)', value: active.cui || '' })
          if (active.regCom) {
            attrs.push({ key: 'Număr Registrul Comerțului', value: active.regCom })
          }
          attrs.push({ key: 'TVA', value: active.isVatPayer ? 'Da' : 'Nu' })
          attrs.push({ key: 'e-Invoice', value: active.isEInvoiceActive ? 'Da' : 'Nu' })
        }

        const fullAddress = `${active.address || ''}, ${active.city || ''}, ${active.province || ''}, Cod Postal: ${active.zip || ''}, Tel: ${active.phone || ''}`
        attrs.push({ key: 'Adresă Facturare', value: fullAddress })
      }
    }

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_attributes',
          cartId: cart.id,
          attributes: attrs,
        }),
      })
    } catch {
      // Quietly ignore network/sync failure
    }
  }, [cart?.id, user, billingProfiles])

  // Sync billing attributes to cart
  useEffect(() => {
    if (hasMounted && cart?.id) {
      const timer = setTimeout(() => {
        updateCartBillingAttributes(sameBillingAddress, selectedBillingProfileId, customBilling)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [sameBillingAddress, selectedBillingProfileId, customBilling, cart?.id, hasMounted, updateCartBillingAttributes])

  const cartLocalities = useMemo(() => {
    return getLocalitiesForCounty(customBilling.province)
  }, [customBilling.province])

  const handleCartAnafLookup = async () => {
    const cleanCui = customBilling.cui?.replace(/\s+/g, '')
    if (!cleanCui || !/^\d{2,10}$/.test(cleanCui)) {
      setCustomBillingError('CUI invalid. Completează cu un cod cifric valid.')
      return
    }

    setIsAnafLoading(true)
    setCustomBillingError(null)
    try {
      const res = await fetch('/api/anaf/cui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cui: cleanCui }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nu s-au putut prelua datele din ANAF.')

      const { parseAnafAddress } = await import('@/lib/ro-address')
      const parsed = parseAnafAddress(data.adresa || '')

      setCustomBilling((prev) => ({
        ...prev,
        companyName: data.denumire || prev.companyName,
        regCom: data.nrRegCom || prev.regCom,
        address: parsed.addressLine || prev.address,
        province: parsed.province || prev.province,
        city: parsed.city || prev.city,
        zip: parsed.postalCode || prev.zip,
        isVatPayer: typeof data.platitorTva === 'boolean' ? data.platitorTva : prev.isVatPayer,
        isEInvoiceActive: typeof data.statusRO_e_Factura === 'boolean' ? data.statusRO_e_Factura : prev.isEInvoiceActive,
      }))
      showToast('Datele firmei au fost preluate din ANAF.')
    } catch (err: unknown) {
      setCustomBillingError(err instanceof Error ? err.message : 'Nu s-au putut prelua datele.')
    } finally {
      setIsAnafLoading(false)
    }
  }

  const handleClearCart = () => {
    clearCart()
    setIsClearCartModalOpen(false)
  }

  const isInitialLoading = !hasMounted || (cart === null && loading)

  return (
    <>
      {isInitialLoading ? (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-24">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-200 pb-6 mb-12 gap-6">
            <div className="space-y-3 w-48">
              <div className="h-2.5 w-24 bg-neutral-200 animate-pulse" />
              <div className="h-8 w-40 bg-neutral-200 animate-pulse" />
              <div className="h-2.5 w-28 bg-neutral-200 animate-pulse" />
            </div>
            <div className="h-9 w-32 bg-neutral-200 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start animate-pulse">
            {/* Cart Items List Skeleton */}
            <div className="lg:col-span-2 space-y-6 divide-y divide-neutral-200 border-t border-b border-neutral-200">
              {Array.from({ length: cachedLineCount }).map((_, index) => (
                <div key={index} className="py-6 flex gap-4 sm:gap-6 items-start">
                  {/* Image & Mobile Quantity Placeholder */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 border border-neutral-200" />
                    <div className="sm:hidden mt-3 w-20 h-7 bg-neutral-200 animate-pulse" />
                  </div>

                  {/* Details Placeholder */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div className="space-y-3.5">
                      <div className="h-4 bg-neutral-200 w-3/4" />
                      <div className="h-3 bg-neutral-200 w-1/4" />
                      <div className="h-3 bg-neutral-200 w-1/2" />
                    </div>

                    {/* Mobile-only Actions Row Placeholder */}
                    <div className="flex sm:hidden items-center justify-between mt-3">
                      <div className="w-12 h-3 bg-neutral-200" />
                      <div className="w-16 h-4 bg-neutral-200" />
                    </div>

                    {/* Desktop-only Quantity & Price Column Placeholder */}
                    <div className="hidden sm:flex flex-row items-center justify-end gap-8 flex-shrink-0 w-auto">
                      <div className="flex flex-col gap-2.5 items-end">
                        <div className="w-24 h-8 bg-neutral-200" />
                        <div className="w-12 h-3 bg-neutral-200" />
                      </div>
                      <div className="w-20 h-5 bg-neutral-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 space-y-6">
                <div className="h-4.5 bg-neutral-200 w-1/2 border-b border-neutral-200 pb-4 mb-6" />
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <div className="w-16 h-3.5 bg-neutral-200" />
                  <div className="w-12 h-3.5 bg-neutral-200" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="w-16 h-3.5 bg-neutral-200" />
                    <div className="w-12 h-3.5 bg-neutral-200" />
                  </div>
                  <div className="h-[1px] bg-neutral-200" />
                  <div className="flex justify-between">
                    <div className="w-20 h-5 bg-neutral-200" />
                    <div className="w-16 h-5 bg-neutral-200" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-11 bg-neutral-300 w-full" />
                  <div className="h-11 bg-neutral-200 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (!cart || cart.lines.edges.length === 0) ? (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-24 min-h-[60vh]">
          {/* Elegant Header */}
          <div className="text-center mb-10 md:mb-12">
            <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-[#8a8a8a] mb-4 block">
              Maison Outdoor
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight tracking-[0.15em] uppercase text-[#1a1a1a] leading-tight">
              Coșul tău
            </h1>
            <div className="h-[1px] w-12 bg-[#1a1a1a]/20 mx-auto mt-6" />
          </div>

          {/* Empty Cart Message (Now at the top) */}
          <div className="text-center py-20 border border-neutral-200 rounded-none bg-neutral-50/50 max-w-3xl mx-auto mb-16">
            <div className="mb-6">
              <ShoppingCart size={40} className="mx-auto text-neutral-400" />
            </div>
            <h2 className="text-base font-bold tracking-wider text-neutral-900 uppercase mb-3">
              Coșul tău este gol
            </h2>
            <p className="text-sm font-light text-neutral-500 mb-8 tracking-wide max-w-sm mx-auto">
              Nu ai adăugat niciun produs în coșul de cumpărături încă.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-neutral-900 font-bold text-[11px] tracking-[0.15em] uppercase py-3.5 px-8 rounded-none transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Începe cumpărăturile</span>
            </Link>
          </div>

          {/* Recently Removed Products (Now at the bottom) */}
          {recentlyRemovedItems.length > 0 && (
            <div className="border-t border-neutral-200 pt-12 max-w-3xl mx-auto w-full">
              <h2 className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-neutral-900 mb-8 text-center">
                PRODUSE ȘTERSE RECENT
              </h2>
              
              <div className="divide-y divide-neutral-200 border-b border-neutral-200 mb-8">
                {recentlyRemovedItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 text-left">
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
                        className="h-4 w-4 border-neutral-300 text-black focus:ring-black rounded-none transition duration-150 ease-in-out cursor-pointer"
                      />
                      {item.image?.url ? (
                        <div className="w-12 h-12 relative bg-[#F9F8F6] border border-neutral-100 flex-shrink-0">
                          <Image
                            src={item.image.url}
                            alt={item.image.altText || item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-neutral-50 flex items-center justify-center rounded-none border border-neutral-200 flex-shrink-0">
                          <ShoppingCart className="text-neutral-400" size={16} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs md:text-[15px] font-semibold text-neutral-800 tracking-wide">
                          {item.title}
                        </p>
                        <p className="text-[10px] md:text-[13px] text-neutral-500 tracking-wider mt-0.5 md:mt-1 font-medium">
                          Cantitate: {item.quantity} • <span className="text-red-500/80">eliminat</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRecentlyRemovedItem(item.id)}
                      disabled={loading}
                      className="text-neutral-400 hover:text-black transition-colors p-1 cursor-pointer"
                      aria-label="Remove from history"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6">
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
                  className={`text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold py-3 md:py-3.5 px-6 md:px-8 text-center rounded-none transition-all cursor-pointer w-full sm:w-auto ${
                    selectedItemsToRestore.length === 0
                      ? 'bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-black text-white border border-black hover:bg-neutral-900'
                  }`}
                >
                  Restaurare selectate ({selectedItemsToRestore.length})
                </button>
                <button
                  onClick={async () => {
                    for (const item of recentlyRemovedItems.slice(0, 2)) {
                      await restoreCartItem(item);
                    }
                    setSelectedItemsToRestore([]);
                  }}
                  disabled={loading || recentlyRemovedItems.length === 0}
                  className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold text-neutral-800 bg-white border border-neutral-300 px-6 md:px-8 py-3 md:py-3.5 text-center hover:border-black hover:text-black transition-all cursor-pointer rounded-none w-full sm:w-auto"
                >
                  Restaurare toate ({Math.min(recentlyRemovedItems.length, 2)})
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-24">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-200 pb-6 mb-12 gap-6">
            <div>
              <span className="text-[10px] md:text-xs font-medium tracking-[0.4em] uppercase text-neutral-400 block mb-2">
                Maison Outdoor
              </span>
              <h1 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-neutral-900 leading-tight">
                Coșul tău
              </h1>
              <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-neutral-500 mt-2 block">
                {cart.totalQuantity === 1 ? 'UN PRODUS' : `${cart.totalQuantity} PRODUSE`} ÎN COȘ
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsClearCartModalOpen(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-600 transition-colors font-semibold py-2 px-4 border border-red-200 rounded-none cursor-pointer text-[10px] tracking-[0.15em] uppercase bg-white w-full md:w-auto justify-center"
              >
                <Trash2 size={13} />
                Golește Coșul
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Cart Items & Related Products */}
            <div className="lg:col-span-2">
              <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200 mb-12">
                {cart.lines.edges.map(({node: line}) => (
                  <div key={line.id} className="py-6">
                    <div className="flex gap-4 sm:gap-6 items-start">
                      {/* Product Image & Mobile Quantity */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F9F8F6] border border-neutral-100 rounded-none overflow-hidden relative">
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
                                fill
                                priority={true}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                                Fără Imagine
                              </div>
                            )}
                          </Link>
                        </div>

                        {/* Quantity Selector - Mobile Only */}
                        <div className="sm:hidden mt-3">
                          <div className="flex items-center border border-neutral-300 rounded-none bg-white">
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
                              className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-[#F9F8F6] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold text-neutral-900 select-none">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(line.id, line.quantity + 1)}
                              disabled={loading}
                              className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-[#F9F8F6] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Product Details & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        {/* Left Info */}
                        <div className="pr-0 sm:pr-4">
                          <Link
                            href={`/products/${line.merchandise.product.handle}`}
                            className="text-[14px] md:text-[17px] font-semibold tracking-wide text-neutral-900 hover:text-black line-clamp-2"
                          >
                            {line.merchandise.product.title}
                          </Link>
                          {line.merchandise.sku && (
                            <p className="text-xs md:text-[13px] text-neutral-400 mt-1 font-mono tracking-wider">
                              SKU: {line.merchandise.sku}
                            </p>
                          )}
                          {/* Display selected options */}
                          {line.merchandise.selectedOptions && line.merchandise.selectedOptions.length > 0 && (
                            (() => {
                              const filteredOptions = line.merchandise.selectedOptions.filter(
                                (option) => option.value !== 'Default Title'
                              );
                              return filteredOptions.length > 0 ? (
                                <div className="text-xs md:text-[13px] text-neutral-500 mt-1.5 space-y-1 tracking-wide font-normal">
                                  {filteredOptions.map((option, optIndex) => (
                                    <p key={optIndex}>
                                      <span className="text-neutral-400 font-medium">{option.name}:</span> {option.value}
                                    </p>
                                  ))}
                                </div>
                              ) : null;
                            })()
                          )}
                        </div>

                        {/* Mobile-only Delete and Price Row */}
                        <div className="flex sm:hidden items-center justify-between mt-3">
                          <button
                            onClick={() => removeFromCart(line.id)}
                            disabled={loading}
                            className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-semibold text-neutral-400 hover:text-red-600 cursor-pointer transition-colors underline underline-offset-4"
                          >
                            Șterge
                          </button>
                          
                          <div className="text-[15px] font-bold text-neutral-950 flex items-center h-5">
                            {loading ? (
                              <div className="w-16 h-4 bg-neutral-200 animate-pulse" />
                            ) : (
                              formatMoney(parseFloat(line.merchandise.price.amount) * line.quantity, currencyCode)
                            )}
                          </div>
                        </div>

                        {/* Desktop-only Quantity, Delete and Price Column */}
                        <div className="hidden sm:flex flex-row items-center justify-end gap-8 flex-shrink-0 w-auto">
                          {/* Controls and Remove Button */}
                          <div className="flex flex-col gap-2.5 items-end">
                            <div className="flex items-center border border-neutral-300 rounded-none bg-white">
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
                                className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-[#F9F8F6] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs md:text-[13px] font-semibold text-neutral-900 select-none">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(line.id, line.quantity + 1)}
                                disabled={loading}
                                className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-[#F9F8F6] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(line.id)}
                              disabled={loading}
                              className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-semibold text-neutral-400 hover:text-red-600 cursor-pointer transition-colors underline underline-offset-4"
                            >
                              Șterge
                            </button>
                          </div>

                          {/* Item Total Price */}
                          <div className="text-[15px] md:text-[17px] font-bold text-neutral-950 w-28 text-right flex justify-end items-center h-5 md:h-6">
                            {loading ? (
                              <div className="w-20 h-4 bg-neutral-200 animate-pulse" />
                            ) : (
                              formatMoney(parseFloat(line.merchandise.price.amount) * line.quantity, currencyCode)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recently Removed Products (limit 2) */}
              {recentlyRemovedItems.length > 0 && (
                <div className="border-t border-neutral-200 mt-12 pt-8">
                  <h2 className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-neutral-900 mb-6">
                    PRODUSE ȘTERSE RECENT
                  </h2>
                  
                  <div className="divide-y divide-neutral-200 border-b border-neutral-200 mb-6">
                    {recentlyRemovedItems.slice(0, 2).map((item) => (
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
                            className="h-4 w-4 border-neutral-300 text-black focus:ring-black rounded-none transition duration-150 ease-in-out cursor-pointer"
                          />
                          {item.image?.url ? (
                            <div className="w-12 h-12 relative bg-[#F9F8F6] border border-neutral-100 flex-shrink-0">
                              <Image
                                src={item.image.url}
                                alt={item.image.altText || item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-neutral-50 flex items-center justify-center rounded-none border border-neutral-200 flex-shrink-0">
                              <ShoppingCart className="text-neutral-400" size={16} />
                            </div>
                          )}
                          <div>
                            <p className="text-xs md:text-[15px] font-semibold text-neutral-800 tracking-wide">
                              {item.title}
                            </p>
                            <p className="text-[10px] md:text-[13px] text-neutral-500 tracking-wider mt-0.5 md:mt-1 font-medium">
                              Cantitate: {item.quantity} • <span className="text-red-500/80">eliminat</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeRecentlyRemovedItem(item.id)}
                          disabled={loading}
                          className="text-neutral-400 hover:text-black transition-colors p-1 cursor-pointer"
                          aria-label="Remove from history"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-6">
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
                      className={`text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold py-3 md:py-3.5 px-6 md:px-8 text-center rounded-none transition-all cursor-pointer w-full sm:w-auto ${
                        selectedItemsToRestore.length === 0
                          ? 'bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'bg-black text-white border border-black hover:bg-neutral-900'
                      }`}
                    >
                      Restaurare selectate ({selectedItemsToRestore.length})
                    </button>
                    <button
                      onClick={async () => {
                        for (const item of recentlyRemovedItems.slice(0, 2)) {
                          await restoreCartItem(item);
                        }
                        setSelectedItemsToRestore([]);
                      }}
                      disabled={loading || recentlyRemovedItems.length === 0}
                      className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold text-neutral-800 bg-white border border-neutral-300 px-6 md:px-8 py-3 md:py-3.5 text-center hover:border-black hover:text-black transition-all cursor-pointer rounded-none w-full sm:w-auto"
                    >
                      Restaurare toate ({Math.min(recentlyRemovedItems.length, 2)})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 rounded-none sticky top-24">
                <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-900 border-b border-neutral-200 pb-4 mb-6">
                  Sumar Comandă
                </h2>

                {/* Step 1: Subtotal */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-[13px] tracking-wide">
                    <span className="text-neutral-600 font-medium">
                      Subtotal ({cart.totalQuantity}{' '}
                      {cart.totalQuantity === 1 ? 'produs' : 'produse'})
                    </span>
                    {loading ? (
                      <div className="w-20 h-4 bg-neutral-200 animate-pulse" />
                    ) : (
                      <span className="font-semibold text-neutral-900 text-[15px] tracking-wide">
                        {formatMoney(subtotal, currencyCode)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step 2: Address Selection */}
                {user && (
                  <div className="mb-6">
                    {/* Address Selection Button */}
                    <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5.5 h-5.5 rounded-none bg-neutral-200 text-neutral-800 border border-neutral-300 text-[11px] font-bold">
                        1
                      </span>
                      Adresa de livrare
                    </h3>
                    <button
                      onClick={() => {
                        setAddressModalMode('shipping')
                        setIsAddressModalOpen(true)
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-none font-semibold text-[11px] tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer ${selectedDeliveryAddress
                        ? 'border border-neutral-300 text-neutral-800 bg-white hover:border-black hover:text-black'
                        : 'bg-black text-white hover:bg-neutral-900'
                        }`}
                    >
                      <MapPin size={16} />
                      {selectedDeliveryAddress
                        ? 'Modifică adresa de livrare'
                        : 'Selectează adresa de livrare'}
                    </button>

                    {/* Selected Address Display */}
                    {selectedDeliveryAddress && (
                      <div className="mt-4 p-4 bg-white rounded-none border border-neutral-200 text-xs space-y-3">
                        <div className="space-y-1.5 text-neutral-600">
                          <p className="font-semibold text-neutral-900">
                            {selectedDeliveryAddress.firstName}{' '}
                            {selectedDeliveryAddress.lastName}
                          </p>
                          {selectedDeliveryAddress.company && (
                            <p className="text-neutral-400 font-medium">
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
                              <span className="font-semibold">Tel:</span>{' '}
                              {selectedDeliveryAddress.phone}
                            </p>
                          )}
                        </div>

                        {/* Billing Address Selection */}
                        <div className="pt-4 border-t border-neutral-200 mt-4 space-y-4">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sameBillingAddress}
                              onChange={(e) => {
                                setSameBillingAddress(e.target.checked)
                              }}
                              className="h-4 w-4 border-neutral-300 text-black focus:ring-black rounded-none cursor-pointer"
                            />
                            <span className="text-[10px] font-bold tracking-wider text-neutral-800 uppercase">
                              Facturare la adresa de livrare
                            </span>
                          </label>

                          {!sameBillingAddress && (
                            <div className="space-y-4 pt-2">
                              {user && billingProfiles.length > 0 ? (
                                <div className="space-y-3">
                                  <label className="block text-xs font-semibold text-neutral-700">
                                    Selectează un profil de facturare salvat
                                  </label>
                                  <select
                                    value={selectedBillingProfileId}
                                    onChange={(e) => {
                                      setSelectedBillingProfileId(e.target.value)
                                    }}
                                    className="w-full border border-neutral-300 rounded-none px-3 py-2 text-xs focus:border-black outline-none bg-white font-medium"
                                  >
                                    {billingProfiles.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.alias} ({p.type === 'personal' ? 'PF' : 'PJ'})
                                      </option>
                                    ))}
                                    <option value="new">Altă adresă (completare manuală)</option>
                                  </select>

                                  {selectedBillingProfileId !== 'new' && (
                                    (() => {
                                      const p = billingProfiles.find((x) => x.id === selectedBillingProfileId)
                                      if (!p) return null
                                      return (
                                        <div className="p-3 bg-neutral-50 border border-neutral-200 text-[11px] space-y-1 text-neutral-600 relative">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setBillingProfileIdToDelete(p.id!)
                                              setIsDeleteBillingProfileModalOpen(true)
                                            }}
                                            className="absolute top-3 right-3 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Șterge acest profil"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                          <p className="font-semibold text-neutral-900 pr-6">{p.alias}</p>
                                          {p.type === 'personal' ? (
                                            <p>{p.firstName} {p.lastName}</p>
                                          ) : (
                                            <>
                                              <p>{p.companyName} (CUI: {p.cui})</p>
                                              {p.regCom && <p>RegCom: {p.regCom}</p>}
                                              <p>{p.isVatPayer ? 'Plătitor TVA' : 'Neplătitor TVA'} {p.isEInvoiceActive ? '• e-Factura activ' : ''}</p>
                                            </>
                                          )}
                                          <p>{p.address}, {p.city}, {p.province} • {p.zip}</p>
                                          <p>Tel: {p.phone}</p>
                                        </div>
                                      )
                                    })()
                                  )}
                                </div>
                              ) : null}

                              {(selectedBillingProfileId === 'new' || !user || billingProfiles.length === 0) && (
                                <div className="space-y-4 border border-neutral-200 p-4 bg-neutral-50/50">
                                  <p className="text-xs font-bold text-neutral-800">Date facturare noi</p>
                                  
                                  {customBillingError && (
                                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded flex items-center gap-1.5">
                                      <AlertCircle size={14} />
                                      <span>{customBillingError}</span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCustomBilling((prev) => ({ ...prev, type: 'personal' }))}
                                      className={`py-2 text-[10px] font-bold border transition ${
                                        customBilling.type === 'personal'
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                                      }`}
                                    >
                                      Persoană Fizică
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCustomBilling((prev) => ({ ...prev, type: 'business' }))}
                                      className={`py-2 text-[10px] font-bold border transition ${
                                        customBilling.type === 'business'
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                                      }`}
                                    >
                                      Persoană Juridică
                                    </button>
                                  </div>

                                  {customBilling.type === 'personal' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-neutral-600">Prenume</label>
                                        <input
                                          type="text"
                                          value={customBilling.firstName || ''}
                                          onChange={(e) => setCustomBilling((prev) => ({ ...prev, firstName: e.target.value }))}
                                          className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-neutral-600">Nume</label>
                                        <input
                                          type="text"
                                          value={customBilling.lastName || ''}
                                          onChange={(e) => setCustomBilling((prev) => ({ ...prev, lastName: e.target.value }))}
                                          className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-2 items-end">
                                        <div className="col-span-2">
                                          <label className="block text-[10px] font-semibold text-neutral-600">CUI / CIF</label>
                                          <input
                                            type="text"
                                            value={customBilling.cui || ''}
                                            placeholder="Fără RO"
                                            onChange={(e) => setCustomBilling((prev) => ({ ...prev, cui: e.target.value }))}
                                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          disabled={isAnafLoading || !customBilling.cui}
                                          onClick={handleCartAnafLookup}
                                          className="bg-black text-white text-[10px] font-bold py-2 px-1 border border-black hover:opacity-90 disabled:opacity-50 h-[32px] flex items-center justify-center cursor-pointer"
                                        >
                                          {isAnafLoading ? '...' : 'ANAF'}
                                        </button>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-semibold text-neutral-600">Nume Companie</label>
                                        <input
                                          type="text"
                                          value={customBilling.companyName || ''}
                                          onChange={(e) => setCustomBilling((prev) => ({ ...prev, companyName: e.target.value }))}
                                          className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-semibold text-neutral-600">RegCom</label>
                                          <input
                                            type="text"
                                            value={customBilling.regCom || ''}
                                            placeholder="J40/..."
                                            onChange={(e) => setCustomBilling((prev) => ({ ...prev, regCom: e.target.value }))}
                                            className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-1 justify-center pt-2">
                                          <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={customBilling.isVatPayer || false}
                                              onChange={(e) => setCustomBilling((prev) => ({ ...prev, isVatPayer: e.target.checked }))}
                                              className="h-3.5 w-3.5 text-black border-neutral-300 focus:ring-black"
                                            />
                                            <span className="text-[9px] font-bold text-neutral-600">TVA</span>
                                          </label>
                                          <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={customBilling.isEInvoiceActive || false}
                                              onChange={(e) => setCustomBilling((prev) => ({ ...prev, isEInvoiceActive: e.target.checked }))}
                                              className="h-3.5 w-3.5 text-black border-neutral-300 focus:ring-black"
                                            />
                                            <span className="text-[9px] font-bold text-neutral-600">e-Factura</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600">Adresă de facturare</label>
                                    <input
                                      type="text"
                                      value={customBilling.address || ''}
                                      placeholder="Strada, nr., bl., ap."
                                      onChange={(e) => setCustomBilling((prev) => ({ ...prev, address: e.target.value }))}
                                      className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-neutral-600">Județ</label>
                                      <SearchableSelect
                                        value={customBilling.province || ''}
                                        options={RO_COUNTIES}
                                        placeholder="Județ"
                                        inputClassName="border border-neutral-300 px-2 py-1.5 text-xs focus:border-black rounded-none h-8 text-neutral-800 bg-white"
                                        onChange={(nextProvince) => {
                                          setCustomBilling((prev) => ({
                                            ...prev,
                                            province: nextProvince,
                                            city: prev.province !== nextProvince ? '' : prev.city,
                                            zip: prev.province !== nextProvince ? '' : prev.zip,
                                          }))
                                        }}
                                        onSelect={(nextProvince) => {
                                          const canonical = getCanonicalCounty(nextProvince)
                                          setCustomBilling((prev) => ({
                                            ...prev,
                                            province: canonical,
                                            city: '',
                                            zip: '',
                                          }))
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-neutral-600">Localitate</label>
                                      <SearchableSelect
                                        value={customBilling.city || ''}
                                        options={cartLocalities.map((l) => l.name)}
                                        disabled={!customBilling.province}
                                        placeholder="Localitate"
                                        inputClassName="border border-neutral-300 px-2 py-1.5 text-xs focus:border-black rounded-none h-8 text-neutral-800 bg-white"
                                        onChange={(nextCity) => {
                                          setCustomBilling((prev) => ({ ...prev, city: nextCity }))
                                        }}
                                        onSelect={(nextCity) => {
                                          const canonical = getCanonicalLocality(customBilling.province, nextCity)
                                          const code = getPostalCodeForCountyAndLocality(customBilling.province, canonical)
                                          setCustomBilling((prev) => ({
                                            ...prev,
                                            city: canonical,
                                            zip: code || prev.zip,
                                          }))
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-neutral-600">Cod Poștal</label>
                                      <input
                                        type="text"
                                        value={customBilling.zip || ''}
                                        onChange={(e) => setCustomBilling((prev) => ({ ...prev, zip: e.target.value }))}
                                        className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-neutral-600">Telefon</label>
                                      <input
                                        type="tel"
                                        value={customBilling.phone || ''}
                                        onChange={(e) => setCustomBilling((prev) => ({ ...prev, phone: e.target.value }))}
                                        className="w-full border border-neutral-300 px-2 py-1.5 text-xs outline-none bg-white focus:border-black"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step 3: Delivery Method - Only shown if address is selected */}
                        <div className="mt-6 pt-6 border-t border-neutral-200">
                          <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 mb-4 flex items-center gap-2">
                            <span className="flex items-center justify-center w-5.5 h-5.5 rounded-none bg-neutral-200 text-neutral-800 border border-neutral-300 text-[11px] font-bold">
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

                {!user && (
                  <div className="mb-6 p-4 bg-neutral-100/60 border border-neutral-200 text-[11px] text-neutral-600 space-y-3">
                    <p className="leading-relaxed">
                      Autentifică-te pentru a selecta o adresă salvată și a estima costul livrării direct în coș.
                    </p>
                    <Link
                      href="/account/login?redirect=/cart"
                      className="inline-block text-[10px] tracking-wider uppercase font-bold text-black underline underline-offset-4 hover:text-neutral-700 transition-colors"
                    >
                      Autentifică-te aici
                    </Link>
                  </div>
                )}

                {/* Step 4: Cost Summary */}
                <div className="mb-6 space-y-4">
                  <div className="flex justify-between items-center text-[13px] tracking-wide">
                    <span className="text-neutral-600 font-medium">Cost livrare</span>
                    {loading ? (
                      <div className="w-16 h-4 bg-neutral-200 animate-pulse" />
                    ) : shippingCost === 0 ? (
                      <span className="font-semibold text-green-700 tracking-wide">Gratuit</span>
                    ) : (
                      <span className="font-semibold text-neutral-900 text-[15px] tracking-wide">
                        {formatMoney(shippingCost, currencyCode)}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between items-baseline text-[14px] font-bold tracking-[0.15em] uppercase text-neutral-900">
                      <span>Total comandă</span>
                      {loading ? (
                        <div className="w-24 h-6 bg-neutral-200 animate-pulse" />
                      ) : (
                        <span className="text-xl font-bold text-black">
                          {formatMoney(total, currencyCode)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href={cart.checkoutUrl}
                    className={`w-full py-3.5 px-4 rounded-none text-center block font-bold text-[11px] tracking-[0.2em] uppercase transition-all ${user && !selectedDeliveryAddress
                      ? 'border border-neutral-300 text-neutral-400 bg-neutral-100 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-900'
                      }`}
                    onClick={(e) => {
                      if (user && !selectedDeliveryAddress) {
                        e.preventDefault()
                        setAddressModalMode('shipping')
                        setIsAddressModalOpen(true)
                      }
                    }}
                  >
                    Finalizează Comanda
                  </Link>
                  <Link
                    href="/"
                    className="w-full border border-neutral-300 text-neutral-800 py-3.5 px-4 rounded-none hover:bg-white hover:border-black hover:text-black transition-all text-center block font-bold text-[11px] tracking-[0.2em] uppercase"
                  >
                    Continuă cumpărăturile
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-center gap-2 text-[10px] tracking-wider uppercase text-neutral-500">
                    <ShieldCheck className="text-neutral-400" size={16} />
                    <span>Plată securizată prin Shopify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products Section - exact same layout wrapper as PDP */}
      <div className="bg-[#F9F8F6] border-t border-neutral-200 py-24 md:py-32">
        <RelatedProducts />
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        mode={addressModalMode}
        onAddressSelect={async (address) => {
          try {
            if (addressModalMode === 'shipping') {
              await setSelectedDeliveryAddress(address)
            } else {
              await setSelectedBillingAddress(address)
            }
            setIsAddressModalOpen(false)
          } catch {
            setError(
              addressModalMode === 'shipping'
                ? 'Adresa de livrare nu a putut fi actualizată.'
                : 'Adresa de facturare nu a putut fi actualizată.'
            )
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

      <ConfirmationModal
        isOpen={isDeleteBillingProfileModalOpen}
        onClose={() => {
          setIsDeleteBillingProfileModalOpen(false)
          setBillingProfileIdToDelete(null)
        }}
        onConfirm={handleDeleteBillingProfile}
        title="Confirmă ștergerea"
        message="Ești sigur că vrei să ștergi acest profil de facturare?"
      />
    </>
  )
}
