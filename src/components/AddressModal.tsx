'use client'
import { useState, useEffect } from 'react'
import { X, Plus, ArrowLeft } from 'lucide-react'
import { romanianCounties, bucharestSectors } from '@/lib/geo-data'

export type Address = {
  id: string
  firstName: string
  lastName: string
  company?: string
  name?: string
  address1: string
  address2: string | null
  city: string
  country: string
  province?: string
  zip: string
  phone?: string
  isDefault: boolean
}

type AddressModalProps = {
  isOpen: boolean
  onClose: () => void
  onAddressSelect?: (address: Address) => void
  mode?: 'default' | 'shipping'
}

export default function AddressModal({
  isOpen,
  onClose,
  onAddressSelect,
  mode = 'default',
}: AddressModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    province: 'București',
    zip: '',
    country: 'Romania',
    phone: '',
    company: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchAddresses()
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/account/addresses')
      if (!response.ok) {
        throw new Error('Failed to fetch addresses')
      }
      const data = await response.json()
      const fetchedAddresses = data.addresses || []
      const defaultAddress = data.defaultAddress

      setAddresses(fetchedAddresses)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id)
      } else if (fetchedAddresses.length > 0) {
        setSelectedAddress(fetchedAddresses[0].id)
      }

      // If no addresses, automatically switch to add mode
      if (fetchedAddresses.length === 0) {
        setIsAdding(true)
      } else {
        setIsAdding(false)
      }
    } catch (err: any) {
      console.error(err)
      setError('Nu am putut încărca adresele.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Map Sector to București for Shopify validation if needed
      const isBucharest =
        formData.city.trim().toLowerCase() === 'bucuresti' ||
        formData.city.trim().toLowerCase() === 'bucurești'

      const submissionData = {
        ...formData,
        // We send "București" as province but keep the city as București.
        // The sector info can be kept in province for our display, 
        // but for Shopify creation let's see if we need a valid province.
        province: isBucharest ? 'București' : formData.province,
        // Keep the sector in address2 or notes if we want to preserve it?
        // Actually, if we use "București" it's valid. 
        // Let's prepend the sector to address1 if it's there to not lose it, 
        // or just rely on the zip code.
        address1: isBucharest ? `${formData.province}, ${formData.address1}` : formData.address1
      }

      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: submissionData }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Eroare la salvarea adresei.')
      }

      setSuccess('Adresa a fost salvată cu succes!')

      // Small delay before switching back to list
      setTimeout(async () => {
        await fetchAddresses()
        setIsAdding(false)
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDefault = async () => {
    if (!selectedAddress) return
    setError(null)
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddress }),
      })
      if (!response.ok) {
        throw new Error('Failed to set default address')
      }
      onClose()
    } catch (err) {
      console.error(err)
      setError('Eroare la setarea adresei implicite.')
    }
  }

  if (!isOpen) {
    return null
  }

  const isBucuresti =
    formData.city.trim().toLowerCase() === 'bucuresti' ||
    formData.city.trim().toLowerCase() === 'bucurești'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdding ? 'Adaugă adresă nouă' : 'Selectează adresa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
              <p className="text-gray-500 font-medium font-serif">Se încarcă adresele...</p>
            </div>
          ) : isAdding ? (
            <form id="add-address-form" onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Prenume</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                    placeholder="ex: Mihai"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Nume</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                    placeholder="ex: Popescu"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Adresă (stradă, număr)</label>
                <input
                  type="text"
                  required
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                  placeholder="ex: Str. Exemplului nr. 1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Apartament, suită, etc. (opțional)</label>
                <input
                  type="text"
                  value={formData.address2 || ''}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                  placeholder="ex: Bl. A2, Sc. 1, Ap. 12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Oraș</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => {
                      const newCity = e.target.value
                      const isBuch =
                        newCity.trim().toLowerCase() === 'bucuresti' ||
                        newCity.trim().toLowerCase() === 'bucurești'
                      setFormData({
                        ...formData,
                        city: newCity,
                        province: isBuch ? 'Sector 1' : (formData.province.startsWith('Sector') ? 'Alba' : formData.province),
                      })
                    }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                    placeholder="ex: București"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    {isBucuresti ? 'Sector' : 'Județ'}
                  </label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none bg-white font-medium"
                  >
                    {isBucuresti
                      ? bucharestSectors.map((sector) => (
                        <option key={sector.code} value={sector.name}>
                          {sector.name}
                        </option>
                      ))
                      : romanianCounties
                        .filter((c) => c.name !== 'București')
                        .map((county) => (
                          <option key={county.code} value={county.name}>
                            {county.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Cod Poștal</label>
                  <input
                    type="text"
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                    placeholder="ex: 123456"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                    placeholder="ex: 0721 123 456"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedAddress === address.id
                      ? 'border-green-600 bg-green-50/50'
                      : 'border-gray-100 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedAddress(address.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-base text-gray-900">
                        {address.firstName} {address.lastName}
                      </p>
                      <p className="text-gray-600">{address.address1}</p>
                      {address.address2 && <p className="text-gray-500 text-xs italic">{address.address2}</p>}
                      <p className="text-gray-700 font-medium">
                        {address.city}, {address.province} • {address.zip}
                      </p>
                      {address.phone && (
                        <p className="text-gray-600 flex items-center gap-1 mt-2">
                          <span className="text-gray-400">Tel:</span> {address.phone}
                        </p>
                      )}
                    </div>
                    {selectedAddress === address.id && (
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setError(null)
                  setIsAdding(true)
                }}
                className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-600 hover:text-green-600 hover:bg-green-50/30 transition-all group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Adaugă adresă nouă</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 border-t border-gray-100 flex justify-between items-center gap-4 bg-gray-50/50">
          {isAdding && addresses.length > 0 ? (
            <button
              onClick={() => {
                setError(null)
                setIsAdding(false)
              }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Înapoi
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm transition-all text-sm font-semibold"
            >
              Anulează
            </button>
            {isAdding ? (
              <button
                type="submit"
                form="add-address-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  'Salvează Adresa'
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const address = addresses.find((a) => a.id === selectedAddress)
                  if (address && onAddressSelect) {
                    onAddressSelect(address)
                  } else if (!isAdding && mode === 'default') {
                    handleSetDefault()
                  }
                }}
                disabled={!selectedAddress}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
              >
                {mode === 'shipping' ? 'Confirmă Adresa' : 'Setează ca implicită'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
