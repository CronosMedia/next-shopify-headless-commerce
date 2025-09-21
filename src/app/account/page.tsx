'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  User as UserIcon,
  Package,
  MapPin,
  CreditCard,
  LogOut,
  Edit,
  Save,
  X,
  PlusCircle,
  Trash2,
  Star,
  AlertCircle,
  ChevronRight,
  Settings, // Added for Security & Settings
  HelpCircle, // Added for Help Center
} from 'lucide-react'
import {
  useAuth,
  Order,
  Address,
  AddressInput,
  User,
  ApiError,
} from '@/components/AuthProvider'
import { useCart } from '@/components/CartProvider'
import { romanianCounties } from '@/lib/geo-data'

// Main component for the account page
export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, loading, logout } = useAuth()
  const { cart } = useCart()

  if (loading) return <LoadingSpinner />
  if (!user) return <AuthForm />

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground">Salutare {user.firstName}!</h1>
      <p className="text-lg text-muted-foreground mb-8">Bine ai venit în contul tău!</p>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={() => logout(cart?.id)}
        />
        <MainContent activeTab={activeTab} user={user} />
      </div>
    </div>
  )
}

// --- Sub-components ---

function LoadingSpinner() {
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-background rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Se încarcă...</p>
      </div>
    </div>
  )
}

function AuthForm() {
  const { login, register, loading } = useAuth()
  const { cart } = useCart()
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
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
        setError(apiError.error.message)
      }
    } catch {
      setError('A apărut o eroare neașteptată.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-background rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground">
          {isLogin ? 'Autentificare' : 'Creează Cont'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
              {error}
            </div>
          )}
          {!isLogin && (
            <>
              <InputField
                placeholder="Prenume"
                value={formData.firstName}
                onChange={(val) => setFormData({ ...formData, firstName: val })}
              />
              <InputField
                placeholder="Nume"
                value={formData.lastName}
                onChange={(val) => setFormData({ ...formData, lastName: val })}
              />
            </>
          )}
          <InputField
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
          />
          <InputField
            type="password"
            placeholder="Parolă"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
          />
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? 'Vă rugăm așteptați...'
              : isLogin
              ? 'Autentificare'
              : 'Creează Cont'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Nu ai cont?' : 'Ai deja cont?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Înregistrează-te' : 'Autentifică-te'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void }) {
  const accountManagementItems = [
    { id: 'profile', label: 'Detalii personale', icon: UserIcon },
    { id: 'orders', label: 'Istoric comenzi', icon: Package },
    { id: 'payment', label: 'Metode de plată', icon: CreditCard },
    { id: 'addresses', label: 'Adrese', icon: MapPin },
    { id: 'settings', label: 'Securitate și setări', icon: Settings },
  ]

  return (
    <div className="lg:col-span-1 border border-gray-300 rounded-none p-4">
      <h2 className="text-xl font-semibold text-foreground mb-4">Administrare cont</h2>
      <nav className="divide-y divide-gray-300 mb-8">
        {accountManagementItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 text-left transition-colors relative cursor-pointer ${
              activeTab === item.id
                ? 'py-3 pl-4 text-foreground hover:bg-secondary'
                : 'text-foreground hover:bg-secondary pl-4 py-3'
            }`}
          >
            <div
              className={`absolute top-0 h-full w-2 bg-gray-700 -left-4 transform origin-left transition-all duration-300 ease-in-out ${
                activeTab === item.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`}
            ></div>
            <item.icon size={20} className="ml-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <h2 className="text-xl font-semibold text-foreground mb-4">Ajutor</h2>
      <nav className="divide-y divide-gray-300">
        <Link href="/help-center" className="w-full flex items-center gap-3 py-3 text-left text-foreground hover:bg-secondary transition-colors pl-4 cursor-pointer">
          <HelpCircle size={20} />
          <span>Centru de ajutor (FAQ)</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 py-3 text-left text-red-600 hover:bg-red-500/10 transition-colors pl-4 cursor-pointer"
        >
          <LogOut size={20} />
          <span>Deconectare</span>
        </button>
      </nav>
    </div>
  )
}

function MainContent({ activeTab, user }: { activeTab: string; user: User }) {
  const [renderedActiveTab, setRenderedActiveTab] = useState(activeTab);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderedActiveTab(activeTab);
    }, 150); // A small delay (e.g., 150ms) before rendering the new tab content
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div className="lg:col-span-3">
      <div key={activeTab}> {/* Key prop to force re-render */}
        {renderedActiveTab === 'profile' && <ProfileTab user={user} />}
        {renderedActiveTab === 'orders' && <OrdersTab />}
        {renderedActiveTab === 'addresses' && <AddressesTab user={user} />}
        {renderedActiveTab === 'payment' && <PaymentTab />}
        {renderedActiveTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="bg-background rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Securitate și Setări
      </h2>
      <p className="text-muted-foreground">
        Aici vei putea gestiona setările de securitate și alte preferințe ale contului tău.
        (Funcționalitate în dezvoltare)
      </p>
    </div>
  )
}

function ProfileTab({ user }: { user: User }) {
  const { updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const apiError = await updateUser(formData)
    if (apiError) {
      setError(apiError.error.message)
    } else {
      setIsEditing(false)
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <form onSubmit={handleUpdate}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Informații Profil
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Edit size={16} />
              <span>Editează</span>
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
                <span>Anulează</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Se salvează...' : 'Salvează'}</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              placeholder="Prenume"
              value={formData.firstName}
              onChange={(val) => setFormData({ ...formData, firstName: val })}
            />
            <InputField
              placeholder="Nume"
              value={formData.lastName}
              onChange={(val) => setFormData({ ...formData, lastName: val })}
            />
            <InputField
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(val) => setFormData({ ...formData, email: val })}
              className="md:col-span-2"
            />
            <InputField
              placeholder="Telefon (ex. +40 712 345 678)"
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              className="md:col-span-2"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Prenume
              </label>
              <p className="mt-1 text-foreground font-medium">
                {user.firstName || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Nume
              </label>
              <p className="mt-1 text-foreground font-medium">
                {user.lastName || '-'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="mt-1 text-foreground font-medium">{user.email}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Telefon
              </label>
              <p className="mt-1 text-foreground font-medium">
                {user.phone || '-'}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

function OrdersTab() {
  const { fetchOrders } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      const fetchedOrders = await fetchOrders()
      setOrders(fetchedOrders)
      setIsLoading(false)
    }
    loadOrders()
  }, [fetchOrders])

  if (isLoading)
    return <p className="text-muted-foreground">Se încarcă comenzile...</p>

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Istoric Comenzi
      </h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Nu ai nicio comandă.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order.id.split('/').pop()
            return (
              <Link key={order.id} href={`/account/orders/${orderId}`}>
                <div className="border border-muted rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Comanda #{order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Plasată pe{' '}
                      {new Date(order.processedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {order.totalPrice.amount} {order.totalPrice.currencyCode}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        order.fulfillmentStatus === 'FULFILLED'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground" size={20} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddressesTab({ user }: { user: User }) {
  const { addAddress, updateAddress, deleteAddress, setDefaultAddress } =
    useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const addresses = useMemo(
    () => user.addresses.edges.map((e) => e.node),
    [user.addresses]
  )

  const handleAddNew = () => {
    setEditingAddress(null)
    setIsFormOpen(true)
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Sigur doriți să ștergeți această adresă?')) {
      await deleteAddress(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingAddress(null)
  }

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Adrese Salvate
        </h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:brightness-110 transition-all"
        >
          <PlusCircle size={16} />
          <span>Adaugă Adresă Nouă</span>
        </button>
      </div>

      {isFormOpen && (
        <AddressForm
          user={user}
          address={editingAddress}
          onClose={handleFormClose}
          onSubmit={
            editingAddress
              ? (addr) => updateAddress(editingAddress.id, addr)
              : addAddress
          }
        />
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-muted-foreground">Nu ai nicio adresă salvată.</p>
        ) : (
          addresses.map((address: Address) => (
            <div
              key={address.id}
              className="border border-muted rounded-lg p-4 flex items-start justify-between"
            >
              <div>
                <p className="font-medium flex items-center gap-2 text-foreground">
                  {address.company || 'Adresă'}
                  {user.defaultAddress?.id === address.id && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} /> Implicită
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {address.firstName} {address.lastName}
                  <br />
                  {address.address1}
                  <br />
                  {address.address2 && (
                    <span>
                      {address.address2}
                      <br />
                    </span>
                  )}
                  {address.city}, {address.province} {address.zip}
                  <br />
                  {address.country}
                  {address.phone && (
                    <>
                      <br />
                      <span className="font-medium">Tel:</span> {address.phone}
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {user.defaultAddress?.id !== address.id && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    Setează ca implicită
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-primary hover:brightness-125"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-red-600 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AddressForm({
  user,
  address,
  onClose,
  onSubmit,
}: {
  user: User
  address: Address | null
  onClose: () => void
  onSubmit: (data: AddressInput) => Promise<ApiError | null>
}) {
  const [formData, setFormData] = useState(() => {
    const initial = {
      firstName: address?.firstName || user.firstName || '',
      lastName: address?.lastName || user.lastName || '',
      company: address?.company || '',
      phone: address?.phone || user.phone || '',
      street: '',
      streetNo: '',
      building: '',
      staircase: '',
      floor: '',
      apartment: '',
      city: address?.city || '',
      province: address?.province || '',
      zip: address?.zip || '',
      country: address?.country || 'Romania',
    }

    if (address?.address1) {
      const parts = address.address1.split(',')
      initial.street = parts[0]?.replace('Str.', '').trim() || ''
      initial.streetNo = parts[1]?.replace('Nr.', '').trim() || ''
    }

    if (address?.address2) {
      const parts = address.address2.split(',')
      initial.building = parts[0]?.replace('Bl.', '').trim() || ''
      initial.staircase = parts[1]?.replace('Sc.', '').trim() || ''
      initial.floor = parts[2]?.replace('Et.', '').trim() || ''
      initial.apartment = parts[3]?.replace('Ap.', '').trim() || ''
    }

    return initial
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (address?.province) {
      const matchingCounty = romanianCounties.find(
        (c) => c.name === address.province || c.code === address.province
      )
      if (matchingCounty) {
        setFormData((prev) => ({ ...prev, province: matchingCounty.code }))
      }
    }
  }, [address])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName) newErrors.firstName = 'Prenumele este obligatoriu.'
    if (!formData.lastName) newErrors.lastName = 'Numele este obligatoriu.'
    if (!formData.street) newErrors.street = 'Strada este obligatorie.'
    if (!formData.streetNo) newErrors.streetNo = 'Numărul este obligatoriu.'
    if (!formData.city) newErrors.city = 'Localitatea este obligatorie.'
    if (!formData.province) newErrors.province = 'Județul este obligatoriu.'
    if (!formData.zip) newErrors.zip = 'Codul poștal este obligatoriu.'
    if (!formData.country) newErrors.country = 'Țara este obligatorie.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsSubmitting(true)
    setErrors({})

    const address2Parts = [
      formData.building ? `Bl. ${formData.building}` : '',
      formData.staircase ? `Sc. ${formData.staircase}` : '',
      formData.floor ? `Et. ${formData.floor}` : '',
      formData.apartment ? `Ap. ${formData.apartment}` : '',
    ]
      .filter(Boolean)
      .join(', ')

    const apiAddress: AddressInput = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company,
      phone: formData.phone,
      address1: `Str. ${formData.street}, Nr. ${formData.streetNo}`,
      address2: address2Parts,
      city: formData.city,
      province: formData.province,
      zip: formData.zip,
      country: formData.country,
    }

    const apiError = await onSubmit(apiAddress)
    if (apiError) {
      setErrors({ form: apiError.error.message })
    } else {
      onClose()
    }
    setIsSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 p-4 border border-muted rounded-lg bg-secondary/50 space-y-4"
    >
      <h3 className="text-lg font-semibold text-foreground">
        {address ? 'Editează Adresa' : 'Adaugă Adresă Nouă'}
      </h3>

      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errors.form}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          placeholder="Numele adresei (ex. Acasă, Birou)"
          value={formData.company || ''}
          onChange={(val) => setFormData({ ...formData, company: val })}
          error={errors.company}
          className="md:col-span-2"
        />
        <InputField
          placeholder="Prenume"
          value={formData.firstName}
          onChange={(val) => setFormData({ ...formData, firstName: val })}
          error={errors.firstName}
          required
        />
        <InputField
          placeholder="Nume"
          value={formData.lastName}
          onChange={(val) => setFormData({ ...formData, lastName: val })}
          error={errors.lastName}
          required
        />
        <InputField
          placeholder="Telefon"
          value={formData.phone || ''}
          onChange={(val) => setFormData({ ...formData, phone: val })}
          error={errors.phone}
          className="md:col-span-2"
        />
        <InputField
          placeholder="Stradă"
          value={formData.street}
          onChange={(val) => setFormData({ ...formData, street: val })}
          error={errors.street}
          required
        />
        <InputField
          placeholder="Număr"
          value={formData.streetNo}
          onChange={(val) => setFormData({ ...formData, streetNo: val })}
          error={errors.streetNo}
          required
        />
        <InputField
          placeholder="Bloc (Opțional)"
          value={formData.building}
          onChange={(val) => setFormData({ ...formData, building: val })}
          error={errors.building}
        />
        <InputField
          placeholder="Scară (Opțional)"
          value={formData.staircase}
          onChange={(val) => setFormData({ ...formData, staircase: val })}
          error={errors.staircase}
        />
        <InputField
          placeholder="Etaj (Opțional)"
          value={formData.floor}
          onChange={(val) => setFormData({ ...formData, floor: val })}
          error={errors.floor}
        />
        <InputField
          placeholder="Apartament (Opțional)"
          value={formData.apartment}
          onChange={(val) => setFormData({ ...formData, apartment: val })}
          error={errors.apartment}
        />
        <InputField
          placeholder="Localitate"
          value={formData.city}
          onChange={(val) => setFormData({ ...formData, city: val })}
          error={errors.city}
          required
        />
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Județ <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.province}
            onChange={(e) =>
              setFormData({ ...formData, province: e.target.value })
            }
            className={`w-full px-3 py-2 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary ${
              errors.province ? 'border-red-500' : 'border-muted'
            }`}
          >
            <option value="" disabled>
              Selectează un județ
            </option>
            {romanianCounties.map((county) => (
              <option key={county.code} value={county.code}>
                {county.name}
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-sm text-red-600 mt-1">{errors.province}</p>
          )}
        </div>
        <InputField
          placeholder="Cod Poștal"
          value={formData.zip}
          onChange={(val) => setFormData({ ...formData, zip: val })}
          error={errors.zip}
          required
        />
        <InputField
          placeholder="Țară"
          value={formData.country}
          onChange={(val) => setFormData({ ...formData, country: val })}
          error={errors.country}
          disabled
          required
        />
      </div>
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? 'Se salvează...' : 'Salvează Adresa'}
        </button>
      </div>
    </form>
  )
}

function InputField({
  placeholder,
  value,
  onChange,
  error,
  className = '',
  type = 'text',
  required = false,
  disabled = false,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
  type?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        {placeholder}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:bg-secondary ${
          error ? 'border-red-500' : 'border-muted'
        }`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function PaymentTab() {
  return (
    <div className="bg-background rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Metode de plată
      </h2>
      <div className="bg-blue-100 border border-blue-200 text-blue-800 rounded-lg p-4">
        <p className="font-medium">Gestionează metodele de plată la checkout</p>
        <p className="text-sm mt-1">
          Pentru securitatea ta, metodele de plată pot fi adăugate, modificate
          sau șterse în timpul procesului de finalizare a comenzii.
        </p>
      </div>
    </div>
  )
}
