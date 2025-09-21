'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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

  useEffect(() => {
    if (isOpen) {
      const fetchAddresses = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/account/addresses')
          if (!response.ok) {
            throw new Error('Failed to fetch addresses')
          }
          const { addresses: fetchedAddresses, defaultAddress } =
            await response.json()
          setAddresses(fetchedAddresses)
          if (defaultAddress) {
            setSelectedAddress(defaultAddress.id)
          }
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
      fetchAddresses()
    }
  }, [isOpen])

  const handleSetDefault = async () => {
    if (!selectedAddress) return
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
    } catch (error) {
      console.error(error)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Selectează adresa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <p>Se încarcă adresele...</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border rounded-md cursor-pointer hover:border-gray-300 transition-colors ${
                    selectedAddress === address.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedAddress(address.id)}
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-base">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.company && (
                      <p className="text-gray-500">{address.company}</p>
                    )}
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                      {address.city}, {address.province} {address.zip}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && (
                      <p className="text-gray-600">
                        <span className="font-medium">Tel:</span> {address.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto p-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
          >
            Anulează
          </button>
          {mode === 'shipping' && selectedAddress ? (
            <button
              onClick={() => {
                const address = addresses.find((a) => a.id === selectedAddress)
                if (address && onAddressSelect) {
                  onAddressSelect(address)
                }
              }}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Confirmă Adresa
            </button>
          ) : (
            <button
              onClick={handleSetDefault}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Setează ca implicită
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
