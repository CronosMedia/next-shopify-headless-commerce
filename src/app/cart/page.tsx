'use client'

import { useEffect, useState, useMemo, useCallback, useRef, type Dispatch, type FormEvent, type SetStateAction } from 'react'
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
  Eye,
  EyeOff,
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
  POSTAL_CODE_REGEX_RO,
} from '@/lib/ro-address'
import { normalizeRomanianPhoneForShopify } from '@/lib/phone'

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
  isDefault?: boolean
}

function getPreferredBillingProfile(profiles: BillingProfile[]) {
  return profiles.find((profile) => profile.isDefault) || profiles[0] || null
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
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [addressModalMode, setAddressModalMode] = useState<'shipping' | 'billing'>('shipping')
  const [sameBillingAddress, setSameBillingAddress] = useState(true)
  const [billingType, setBillingType] = useState<'personal' | 'business'>('personal')
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
  const [billingModalError, setBillingModalError] = useState<string | null>(null)
  const [saveBillingToAccount, setSaveBillingToAccount] = useState(false)
  const [isBillingSubmitting, setIsBillingSubmitting] = useState(false)
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



  // Sync selectedBillingProfileId based on billingType and user profiles
  useEffect(() => {
    if (hasMounted && billingProfiles.length > 0) {
      if (selectedBillingProfileId === 'new') return

      const typeProfiles = billingProfiles.filter((p) => p.type === billingType)
      const selectedProfile = typeProfiles.find((profile) => profile.id === selectedBillingProfileId)
      if (selectedProfile) return

      if (typeProfiles.length > 0) {
        setSelectedBillingProfileId(getPreferredBillingProfile(typeProfiles)?.id || '')
      } else {
        setSelectedBillingProfileId('new')
      }
    } else {
      setSelectedBillingProfileId('new')
    }
  }, [billingType, billingProfiles, hasMounted, selectedBillingProfileId])

  // Sync customBilling.type with billingType
  useEffect(() => {
    setCustomBilling((prev) => {
      if (prev.type !== billingType) {
        return { ...prev, type: billingType }
      }
      return prev
    })
  }, [billingType])

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
      try {
        const res = await fetch('/api/account/billing')
        if (res.ok) {
          const data = await res.json()
          const profilesList: BillingProfile[] = data.billingProfiles || []
          setBillingProfiles(profilesList)
          if (profilesList.length > 0) {
            const preferredProfile = getPreferredBillingProfile(profilesList)
            setSelectedBillingProfileId(preferredProfile?.id || 'new')
            if (preferredProfile) {
              setBillingType(preferredProfile.type)
            }
            setSameBillingAddress(false)
          }
        }
      } catch {
        setBillingProfiles([])
      }
    }

    if (user) {
      loadProfiles()
    } else {
      setBillingProfiles([])
      setSelectedBillingProfileId('new')
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
        setSelectedBillingProfileId(getPreferredBillingProfile(updated)?.id || 'new')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Nu am putut șterge profilul de facturare.')
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
        const billingSummaryParts =
          active.type === 'business'
            ? [
                active.companyName || 'Firmă',
                active.cui ? `CUI ${active.cui}` : '',
                active.regCom ? `Reg. Com. ${active.regCom}` : '',
                active.isVatPayer ? 'TVA: Da' : 'TVA: Nu',
                active.isEInvoiceActive ? 'e-Factura: Da' : 'e-Factura: Nu',
              ]
            : [
                `${active.firstName || ''} ${active.lastName || ''}`.trim(),
              ]
        const billingAddressSummary = [
          active.address,
          active.city,
          active.province,
          active.zip,
          active.phone,
        ].filter(Boolean).join(', ')

        attrs = [
          { key: 'Factură solicitată', value: 'Da' },
          { key: 'Tip Facturare', value: active.type === 'personal' ? 'Persoană Fizică' : 'Persoană Juridică' },
          { key: 'Facturare pe firmă', value: active.type === 'business' ? 'Da' : 'Nu' },
          {
            key: 'Rezumat Facturare',
            value: [...billingSummaryParts, billingAddressSummary].filter(Boolean).join(' | '),
          },
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
    if (hasMounted && cart?.id && !isBillingModalOpen) {
      const timer = setTimeout(() => {
        updateCartBillingAttributes(sameBillingAddress, selectedBillingProfileId, customBilling)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [sameBillingAddress, selectedBillingProfileId, customBilling, cart?.id, hasMounted, isBillingModalOpen, updateCartBillingAttributes])

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

  const getActiveBillingProfile = useCallback((): BillingProfile | null => {
    if (sameBillingAddress) {
      return null
    }

    if (user && selectedBillingProfileId && selectedBillingProfileId !== 'new') {
      return billingProfiles.find((profile) => profile.id === selectedBillingProfileId) || null
    }

    return customBilling
  }, [billingProfiles, customBilling, sameBillingAddress, selectedBillingProfileId, user])

  const getBillingSummary = useCallback(() => {
    if (sameBillingAddress) {
      return {
        title: 'Facturare: Persoană fizică',
        lines: selectedDeliveryAddress
          ? [
              `${selectedDeliveryAddress.firstName || ''} ${selectedDeliveryAddress.lastName || ''}`.trim(),
              [selectedDeliveryAddress.address1, selectedDeliveryAddress.city, selectedDeliveryAddress.province]
                .filter(Boolean)
                .join(', '),
            ].filter(Boolean)
          : ['Alege cum vrei să fie emisă factura.'],
      }
    }

    const active = getActiveBillingProfile()
    if (!active) {
      return {
        title: 'Date de facturare',
        lines: ['Alege cum vrei să fie emisă factura.'],
      }
    }

    if (active.type === 'business') {
      return {
        title: 'Facturare: Persoană juridică',
        lines: [
          active.companyName,
          active.cui ? `CUI: ${active.cui}` : '',
          [active.address, active.city, active.province].filter(Boolean).join(', '),
        ].filter(Boolean),
      }
    }

    return {
      title: 'Facturare: Persoană fizică',
      lines: [
        `${active.firstName || ''} ${active.lastName || ''}`.trim(),
        [active.address, active.city, active.province].filter(Boolean).join(', '),
      ].filter(Boolean),
    }
  }, [getActiveBillingProfile, sameBillingAddress, selectedDeliveryAddress])

  const validateBillingProfile = useCallback((profile: BillingProfile) => {
    if (profile.type === 'personal') {
      if (!profile.firstName?.trim() || !profile.lastName?.trim()) {
        return 'Te rugăm să completezi numele și prenumele pentru facturare.'
      }
    } else if (!profile.companyName?.trim() || !profile.cui?.trim() || !profile.regCom?.trim()) {
      return 'Te rugăm să completezi toate datele firmei pentru facturare.'
    }

    if (!profile.address?.trim()) {
      return 'Te rugăm să completezi adresa de facturare.'
    }

    const canonicalProvince = getCanonicalCounty(profile.province || '')
    if (!RO_COUNTIES.includes(canonicalProvince)) {
      return 'Te rugăm să selectezi un județ valid din listă pentru facturare.'
    }

    const localitiesList = getLocalitiesForCounty(canonicalProvince)
    const canonicalCity = getCanonicalLocality(canonicalProvince, profile.city || '')
    if (!localitiesList.some((locality) => locality.name === canonicalCity)) {
      return 'Te rugăm să selectezi o localitate validă din listă pentru facturare.'
    }

    if (!profile.zip || !POSTAL_CODE_REGEX_RO.test(profile.zip)) {
      return 'Codul poștal de facturare trebuie să aibă exact 6 cifre.'
    }

    return null
  }, [])

  const handleApplyBilling = async () => {
    setBillingModalError(null)
    setCustomBillingError(null)

    if (!sameBillingAddress) {
      const active = getActiveBillingProfile()
      if (!active) {
        setBillingModalError('Alege sau completează datele de facturare.')
        return
      }

      const validationError = validateBillingProfile(active)
      if (validationError) {
        setBillingModalError(validationError)
        return
      }

      const normalizedPhone = normalizeRomanianPhoneForShopify(active.phone) ?? ''
      const appliedProfile: BillingProfile = {
        ...active,
        phone: normalizedPhone,
      }

      if (selectedBillingProfileId === 'new' || !user) {
        setCustomBilling(appliedProfile)
      }

      await updateCartBillingAttributes(false, selectedBillingProfileId, appliedProfile)

      if (user && saveBillingToAccount && (selectedBillingProfileId === 'new' || !active.id)) {
        setIsBillingSubmitting(true)
        const profileToSave: BillingProfile = {
          ...appliedProfile,
          isDefault: true,
          alias:
            appliedProfile.alias ||
            (appliedProfile.type === 'business'
              ? appliedProfile.companyName || 'Facturare firmă'
              : 'Facturare personală'),
        }
        try {
          const res = await fetch('/api/account/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save',
              profile: profileToSave,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error?.message || 'Nu am putut salva datele.')

          const updated = data.billingProfiles || []
          const savedProfile = data.billingProfile
          if (!savedProfile?.id || !updated.some((profile: BillingProfile) => profile.id === savedProfile.id)) {
            throw new Error('Datele au fost trimise, dar nu au fost confirmate în cont.')
          }

          setBillingProfiles(updated)
          setSelectedBillingProfileId(savedProfile.id)
          showToast('Datele de facturare au fost salvate în cont.')
        } catch (err: unknown) {
          const message = err instanceof Error
            ? err.message
            : 'Datele au fost folosite pentru comandă, dar nu au putut fi salvate în cont.'
          setBillingModalError(message)
          showToast(message)
        } finally {
          setIsBillingSubmitting(false)
        }
      }
    } else {
      await updateCartBillingAttributes(true)
    }

    setIsBillingModalOpen(false)
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
                            sizes="48px"
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
                            className="block w-full h-full relative"
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
                                sizes="(max-width: 640px) 160px, 192px"
                                quality={95}
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
                                sizes="48px"
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
                  <div className="mb-6 space-y-6">
                    {/* Step 1: Adresa de livrare */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                          1. Adresa de livrare
                        </h3>
                        {selectedDeliveryAddress && (
                          <button
                            onClick={() => {
                              setAddressModalMode('shipping')
                              setIsAddressModalOpen(true)
                            }}
                            className="text-xs font-semibold text-neutral-500 hover:text-black underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Modifică
                          </button>
                        )}
                      </div>

                      {!selectedDeliveryAddress && (
                        <button
                          onClick={() => {
                            setAddressModalMode('shipping')
                            setIsAddressModalOpen(true)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-none font-bold text-[11px] tracking-[0.15em] uppercase bg-black text-white hover:bg-neutral-900 cursor-pointer"
                        >
                          <MapPin size={15} />
                          Selectează adresa de livrare
                        </button>
                      )}

                      {/* Selected Address Display */}
                      {selectedDeliveryAddress && (
                        <div className="text-sm space-y-1 text-neutral-600 pl-4 border-l-2 border-neutral-200">
                          <p className="font-semibold text-neutral-900">
                            {selectedDeliveryAddress.firstName}{' '}
                            {selectedDeliveryAddress.lastName}
                          </p>
                          {selectedDeliveryAddress.company && (
                            <p className="text-neutral-500 font-medium">
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
                          {selectedDeliveryAddress.phone && (
                            <p>
                              <span className="font-semibold text-neutral-500">Tel:</span>{' '}
                              {selectedDeliveryAddress.phone}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Date de facturare */}
                    {selectedDeliveryAddress && (
                      <div className="pt-6 border-t border-neutral-200">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                              2. Date de facturare
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-neutral-500">
                              Alege cum vrei să fie emisă factura.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBillingModalError(null)
                              setIsBillingModalOpen(true)
                            }}
                            className="shrink-0 text-xs font-semibold text-neutral-500 hover:text-black underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            {getBillingSummary().lines.length > 0 ? 'Modifică' : 'Adaugă'}
                          </button>
                        </div>

                        <div className="mt-4 border-l-2 border-neutral-200 pl-4 text-sm text-neutral-600">
                          <p className="font-semibold text-neutral-900">{getBillingSummary().title}</p>
                          <div className="mt-1 space-y-1">
                            {getBillingSummary().lines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Delivery Method - Only shown if address is selected */}
                    {selectedDeliveryAddress && (
                      <div className="mt-6 pt-6 border-t border-neutral-200">
                        <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 mb-4">
                          3. Metoda de livrare
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
                    )}
                  </div>
                )}

                {!user && (
                  <div className="mb-6 p-4 bg-neutral-100/60 border border-neutral-200 text-[11px] text-neutral-600 space-y-3">
                    <p className="leading-relaxed">
                      Autentifică-te pentru a selecta o adresă salvată și a estima costul livrării direct în coș.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="inline-block text-[10px] tracking-wider uppercase font-bold text-black underline underline-offset-4 hover:text-neutral-700 transition-colors"
                    >
                      Autentifică-te aici
                    </button>
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
                        return
                      }

                      // Validate custom billing address if selected
                      if (!sameBillingAddress && selectedBillingProfileId === 'new') {
                        const validationError = validateBillingProfile(customBilling)
                        if (validationError) {
                          e.preventDefault()
                          setBillingModalError(validationError)
                          setIsBillingModalOpen(true)
                          return
                        }
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
              setCustomBilling((prev) => ({
                ...prev,
                type: billingType,
                firstName: address.firstName || prev.firstName,
                lastName: address.lastName || prev.lastName,
                companyName: address.company || prev.companyName,
                address: [address.address1, address.address2].filter(Boolean).join(', '),
                city: address.city || prev.city,
                province: address.province || prev.province,
                zip: address.zip || prev.zip,
                phone: address.phone || prev.phone,
              }))
              setSelectedBillingProfileId('new')
              setIsBillingModalOpen(true)
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

      <BillingDetailsModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        userIsAuthenticated={Boolean(user)}
        billingType={billingType}
        setBillingType={setBillingType}
        sameBillingAddress={sameBillingAddress}
        setSameBillingAddress={setSameBillingAddress}
        billingProfiles={billingProfiles}
        selectedBillingProfileId={selectedBillingProfileId}
        setSelectedBillingProfileId={setSelectedBillingProfileId}
        customBilling={customBilling}
        setCustomBilling={setCustomBilling}
        customBillingError={customBillingError}
        billingModalError={billingModalError}
        cartLocalities={cartLocalities}
        isAnafLoading={isAnafLoading}
        onAnafLookup={handleCartAnafLookup}
        onUseBilling={handleApplyBilling}
        saveBillingToAccount={saveBillingToAccount}
        setSaveBillingToAccount={setSaveBillingToAccount}
        isSubmitting={isBillingSubmitting}
        onDeleteProfile={(profileId) => {
          setBillingProfileIdToDelete(profileId)
          setIsDeleteBillingProfileModalOpen(true)
        }}
      />

      <CartAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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

type CartAuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

type BillingDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  userIsAuthenticated: boolean
  billingType: BillingType
  setBillingType: (type: BillingType) => void
  sameBillingAddress: boolean
  setSameBillingAddress: (value: boolean) => void
  billingProfiles: BillingProfile[]
  selectedBillingProfileId: string
  setSelectedBillingProfileId: (id: string) => void
  customBilling: BillingProfile
  setCustomBilling: Dispatch<SetStateAction<BillingProfile>>
  customBillingError: string | null
  billingModalError: string | null
  cartLocalities: Array<{ name: string }>
  isAnafLoading: boolean
  onAnafLookup: () => void
  onUseBilling: () => void
  saveBillingToAccount: boolean
  setSaveBillingToAccount: (value: boolean) => void
  isSubmitting: boolean
  onDeleteProfile: (profileId: string) => void
}

function BillingDetailsModal({
  isOpen,
  onClose,
  userIsAuthenticated,
  billingType,
  setBillingType,
  sameBillingAddress,
  setSameBillingAddress,
  billingProfiles,
  selectedBillingProfileId,
  setSelectedBillingProfileId,
  customBilling,
  setCustomBilling,
  customBillingError,
  billingModalError,
  cartLocalities,
  isAnafLoading,
  onAnafLookup,
  onUseBilling,
  saveBillingToAccount,
  setSaveBillingToAccount,
  isSubmitting,
  onDeleteProfile,
}: BillingDetailsModalProps) {
  const matchingProfiles = billingProfiles.filter((profile) => profile.type === billingType)
  const selectedProfile = matchingProfiles.find((profile) => profile.id === selectedBillingProfileId)
  const shouldShowManualFields =
    selectedBillingProfileId === 'new' || !userIsAuthenticated || matchingProfiles.length === 0

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:items-center sm:py-6">
      <button
        type="button"
        aria-label="Închide modalul de facturare"
        className="absolute inset-0 bg-black/45 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[calc(100svh-2rem)] w-full max-w-2xl flex-col overflow-hidden border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-5 md:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Checkout
            </p>
            <h2 className="mt-1 text-xl font-light uppercase tracking-[0.08em] text-neutral-950">
              Date de facturare
            </h2>
          </div>
          <button
            type="button"
            aria-label="Închide"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:text-black"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          <div className="space-y-5">
            {(billingModalError || customBillingError) && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                <AlertCircle size={16} className="mt-1 shrink-0" />
                <span>{billingModalError || customBillingError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(['personal', 'business'] as BillingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setBillingType(type)
                    const hasProfilesForType = billingProfiles.some((profile) => profile.type === type)
                    setSameBillingAddress(type === 'personal' && !hasProfilesForType)
                  }}
                  className={`min-h-11 border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    billingType === type
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-black'
                  }`}
                >
                  {type === 'personal' ? 'Persoană fizică' : 'Persoană juridică'}
                </button>
              ))}
            </div>

            {billingType === 'personal' && (
              <label className="flex items-start gap-3 border border-neutral-200 bg-[#F9F8F6]/50 p-4 text-sm leading-6 text-neutral-700">
                <input
                  type="checkbox"
                  checked={sameBillingAddress}
                  onChange={(event) => setSameBillingAddress(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <span>Datele de facturare coincid cu adresa de livrare.</span>
              </label>
            )}

            {!sameBillingAddress && (
              <div className="space-y-5">
                {userIsAuthenticated && matchingProfiles.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      Profil salvat
                    </label>
                    <select
                      value={selectedBillingProfileId}
                      onChange={(event) => setSelectedBillingProfileId(event.target.value)}
                      className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-medium outline-none focus:border-black"
                    >
                      {matchingProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.alias}
                        </option>
                      ))}
                      <option value="new">Altă adresă de facturare</option>
                    </select>

                    {selectedProfile && selectedBillingProfileId !== 'new' && (
                      <div className="relative border-l-2 border-neutral-200 pl-4 text-sm leading-6 text-neutral-600">
                        <button
                          type="button"
                          onClick={() => selectedProfile.id && onDeleteProfile(selectedProfile.id)}
                          className="absolute right-0 top-0 text-neutral-400 transition-colors hover:text-red-600"
                          aria-label="Șterge profilul de facturare"
                        >
                          <Trash2 size={16} />
                        </button>
                        <p className="pr-8 font-semibold text-neutral-950">{selectedProfile.alias}</p>
                        {selectedProfile.type === 'business' ? (
                          <>
                            <p>{selectedProfile.companyName}</p>
                            <p>CUI: {selectedProfile.cui}</p>
                            {selectedProfile.regCom && <p>Reg. Com.: {selectedProfile.regCom}</p>}
                          </>
                        ) : (
                          <p>{selectedProfile.firstName} {selectedProfile.lastName}</p>
                        )}
                        <p>{selectedProfile.address}, {selectedProfile.city}, {selectedProfile.province}</p>
                      </div>
                    )}
                  </div>
                )}

                {shouldShowManualFields && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">
                        Date noi
                      </p>
                      {userIsAuthenticated ? (
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          Completează datele aici sau alege un profil salvat din lista de mai sus.
                        </p>
                      ) : null}
                    </div>

                    {billingType === 'personal' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <BillingInput
                          label="Prenume"
                          value={customBilling.firstName || ''}
                          onChange={(value) => setCustomBilling((prev) => ({ ...prev, firstName: value }))}
                        />
                        <BillingInput
                          label="Nume"
                          value={customBilling.lastName || ''}
                          onChange={(value) => setCustomBilling((prev) => ({ ...prev, lastName: value }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                          <BillingInput
                            label="CUI / CIF"
                            value={customBilling.cui || ''}
                            placeholder="Fără RO"
                            onChange={(value) => setCustomBilling((prev) => ({ ...prev, cui: value }))}
                          />
                          <button
                            type="button"
                            disabled={isAnafLoading || !customBilling.cui}
                            onClick={onAnafLookup}
                            className="h-11 bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-900 disabled:opacity-40"
                          >
                            {isAnafLoading ? '...' : 'ANAF'}
                          </button>
                        </div>
                        <BillingInput
                          label="Firmă"
                          value={customBilling.companyName || ''}
                          onChange={(value) => setCustomBilling((prev) => ({ ...prev, companyName: value }))}
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <BillingInput
                            label="Reg. Com."
                            value={customBilling.regCom || ''}
                            placeholder="ex. J40/1234/2020"
                            onChange={(value) => setCustomBilling((prev) => ({ ...prev, regCom: value }))}
                          />
                          <div className="flex flex-col justify-center gap-2 pt-2">
                            <BillingCheckbox
                              label="Plătitor TVA"
                              checked={Boolean(customBilling.isVatPayer)}
                              onChange={(checked) => setCustomBilling((prev) => ({ ...prev, isVatPayer: checked }))}
                            />
                            <BillingCheckbox
                              label="e-Factura"
                              checked={Boolean(customBilling.isEInvoiceActive)}
                              onChange={(checked) => setCustomBilling((prev) => ({ ...prev, isEInvoiceActive: checked }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <BillingInput
                      label="Adresă facturare"
                      value={customBilling.address || ''}
                      placeholder="Strada, nr., bl., ap."
                      onChange={(value) => setCustomBilling((prev) => ({ ...prev, address: value }))}
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-600">Județ</label>
                        <SearchableSelect
                          value={customBilling.province || ''}
                          options={RO_COUNTIES}
                          placeholder="Județ"
                          inputClassName="border border-neutral-300 px-3 py-2 text-sm focus:border-black rounded-none h-11 text-neutral-800 bg-white w-full"
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
                        <label className="mb-1 block text-xs font-semibold text-neutral-600">Localitate</label>
                        <SearchableSelect
                          value={customBilling.city || ''}
                          options={cartLocalities.map((locality) => locality.name)}
                          disabled={!customBilling.province}
                          placeholder="Localitate"
                          inputClassName="border border-neutral-300 px-3 py-2 text-sm focus:border-black rounded-none h-11 text-neutral-800 bg-white w-full"
                          onChange={(nextCity) => setCustomBilling((prev) => ({ ...prev, city: nextCity }))}
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <BillingInput
                        label="Cod poștal"
                        value={customBilling.zip || ''}
                        onChange={(value) => setCustomBilling((prev) => ({ ...prev, zip: value }))}
                      />
                      <BillingInput
                        label="Telefon"
                        type="tel"
                        value={customBilling.phone || ''}
                        placeholder="0747000000"
                        onChange={(value) => setCustomBilling((prev) => ({ ...prev, phone: value }))}
                      />
                    </div>

                    {userIsAuthenticated ? (
                      <BillingCheckbox
                        label="Salvează aceste date de facturare în contul meu"
                        checked={saveBillingToAccount}
                        onChange={setSaveBillingToAccount}
                      />
                    ) : (
                      <p className="text-xs leading-5 text-neutral-500">
                        Autentifică-te pentru a salva datele de facturare în cont.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/60 px-5 py-5 sm:flex-row sm:justify-end md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 border border-neutral-300 bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-800 transition-colors hover:border-black"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onUseBilling}
            disabled={isSubmitting}
            className="min-h-11 bg-black px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-900 disabled:opacity-50"
          >
            {isSubmitting ? 'Se salvează...' : 'Folosește aceste date'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BillingInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === 'tel' ? 'tel' : undefined}
        inputMode={type === 'tel' ? 'tel' : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
      />
    </div>
  )
}

function BillingCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded-none border-neutral-300 text-black focus:ring-black"
      />
      <span>{label}</span>
    </label>
  )
}

function CartAuthModal({ isOpen, onClose }: CartAuthModalProps) {
  const { login, register, loading } = useAuth()
  const { cart } = useCart()
  const { showToast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

  if (!isOpen) return null

  const isLogin = mode === 'login'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || loading) return

    setError(null)
    setIsSubmitting(true)

    try {
      const apiError = isLogin
        ? await login(formData.email, formData.password, cart?.id)
        : await register(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          cart?.id
        )

      if (apiError) {
        setError(apiError.error.message || 'Emailul sau parola nu sunt corecte. Verifică datele și încearcă din nou.')
        return
      }

      showToast(isLogin ? 'Te-ai autentificat cu succes.' : 'Contul a fost creat.')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModeChange = () => {
    setMode(isLogin ? 'register' : 'login')
    setError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:items-center sm:py-6">
      <button
        type="button"
        aria-label="Închide autentificarea"
        className="absolute inset-0 bg-black/45 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[430px] max-h-[calc(100svh-2rem)] overflow-y-auto bg-white border border-neutral-200 shadow-2xl">
        <button
          type="button"
          aria-label="Închide"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-neutral-500 hover:text-black transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="mb-7 pr-10">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
              Maison Outdoor
            </p>
            <h2 className="text-xl font-light uppercase tracking-[0.12em] text-neutral-950">
              {isLogin ? 'Autentificare' : 'Creează cont'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {isLogin
                ? 'Rămâi în coș și folosește adresele salvate pentru finalizarea comenzii.'
                : 'Creează contul fără să pierzi produsele din coș.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CartAuthField
                  name="given-name"
                  label="Prenume"
                  value={formData.firstName}
                  onChange={(value) => setFormData((prev) => ({ ...prev, firstName: value }))}
                  autoComplete="given-name"
                />
                <CartAuthField
                  name="family-name"
                  label="Nume"
                  value={formData.lastName}
                  onChange={(value) => setFormData((prev) => ({ ...prev, lastName: value }))}
                  autoComplete="family-name"
                />
              </div>
            ) : null}

            <CartAuthField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
              autoComplete="email"
              required
              invalid={Boolean(error)}
            />
            <CartAuthField
              name="password"
              label="Parolă"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              invalid={Boolean(error)}
            />

            {error ? (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 outline-none"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="mt-2 flex h-12 w-full items-center justify-center bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isSubmitting || loading
                ? 'Se verifică...'
                : isLogin
                  ? 'Autentificare'
                  : 'Creează cont'}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-200 pt-5 text-center">
            <p className="text-sm text-neutral-500">
              {isLogin ? 'Nu ai cont?' : 'Ai deja cont?'}{' '}
              <button
                type="button"
                onClick={handleModeChange}
                className="font-semibold text-black underline underline-offset-4 hover:text-neutral-700"
              >
                {isLogin ? 'Înregistrează-te' : 'Autentifică-te'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

type CartAuthFieldProps = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  required?: boolean
  invalid?: boolean
}

function CartAuthField({
  name,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  required = false,
  invalid = false,
}: CartAuthFieldProps) {
  const inputId = `cart-auth-${name}`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          required={required}
          spellCheck={false}
          inputMode={type === 'email' ? 'email' : undefined}
          aria-invalid={invalid}
          className={`h-12 w-full border bg-white px-4 ${isPassword ? 'pr-12' : ''} text-sm text-neutral-950 outline-none transition-colors focus:border-black ${invalid ? 'border-red-500' : 'border-neutral-200'}`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-neutral-500 hover:text-black"
            aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        ) : null}
      </div>
    </label>
  )
}
