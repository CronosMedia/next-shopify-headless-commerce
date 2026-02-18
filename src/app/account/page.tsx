'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation' // Added useRouter and useSearchParams, and Router type
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
  Check, // Added for checked icon
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
import ConfirmationModal from '@/components/ConfirmationModal'

// Main component for the account page
export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

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
          router={router}
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

function Sidebar({ activeTab, setActiveTab, onLogout, router }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void, router: ReturnType<typeof useRouter> }) {
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
            onClick={() => {
              setActiveTab(item.id);
              router.push(`/account?tab=${item.id}`);
            }}
            className={`w-full flex items-center gap-3 text-left transition-colors relative cursor-pointer ${activeTab === item.id
              ? 'py-3 pl-4 text-foreground hover:bg-secondary'
              : 'text-foreground hover:bg-secondary pl-4 py-3'
              }`}
          >
            <div
              className={`absolute top-0 h-full w-2 bg-gray-700 -left-4 transform origin-left transition-all duration-300 ease-in-out ${activeTab === item.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
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
        {renderedActiveTab === 'settings' && <SettingsTab user={user} />}
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: User }) {
  const { refetchUser } = useAuth();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/account/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'A apărut o eroare.');
      }
      setSuccess('Adresa de email a fost schimbată cu succes.');
      setIsEditingEmail(false);
      refetchUser();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }
    try {
      const response = await fetch('/api/account/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'A apărut o eroare.');
      }
      setPassword('');
      setConfirmPassword('');
      setSuccess('Parola a fost schimbată cu succes.');
      setIsEditingPassword(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Securitate și Setări
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4">
          {success}
        </div>
      )}
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Adresă de email</h3>
          {isEditingEmail ? (
            <form onSubmit={handleEmailChange} className="space-y-4 mt-4">
              <InputField
                placeholder="Adresă de email nouă"
                value={email}
                onChange={setEmail}
                type="email"
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-none border-2 border-primary hover:bg-primary-dark text-lg cursor-pointer disabled:opacity-50"
                >
                  Salvează
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between mt-2">
              <p className="text-muted-foreground">{user.email}</p>
              <button
                onClick={() => setIsEditingEmail(true)}
                className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
              >
                <Edit size={20} /> Editează
              </button>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Parolă</h3>
          {isEditingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
              <InputField
                placeholder="Parolă nouă"
                value={password}
                onChange={setPassword}
                type="password"
                required
              />
              <InputField
                placeholder="Confirmă parola nouă"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-none border-2 border-primary hover:bg-primary-dark text-lg cursor-pointer disabled:opacity-50"
                >
                  Salvează
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between mt-2">
              <p className="text-muted-foreground">••••••••</p>
              <button
                onClick={() => setIsEditingPassword(true)}
                className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
              >
                <Edit size={20} /> Editează
              </button>
            </div>
          )}
        </div>
      </div>
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

  return (
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Detaliile mele
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
          >
            <Edit size={20} /> Editează
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <InputField
            placeholder="Prenume"
            value={formData.firstName}
            onChange={(val) => setFormData({ ...formData, firstName: val })}
            required
          />
          <InputField
            placeholder="Nume"
            value={formData.lastName}
            onChange={(val) => setFormData({ ...formData, lastName: val })}
            required
          />
          <InputField
            placeholder="Telefon"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
          />
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-none border-2 border-primary hover:bg-primary-dark text-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="bg-card p-6 border border-gray-300 rounded-none">
            <div className="space-y-4 divide-y divide-gray-300">
              <div className="pt-4 first:pt-0">
                <p className="text-lg font-bold text-foreground">Prenume</p>
                <p className="text-base text-muted-foreground mt-1">
                  {user.firstName || '-'}
                </p>
              </div>
              <div className="pt-4">
                <p className="text-lg font-bold text-foreground">Nume</p>
                <p className="text-base text-muted-foreground mt-1">
                  {user.lastName || '-'}
                </p>
              </div>
              <div className="pt-4">
                <p className="text-lg font-bold text-foreground">Telefon</p>
                <p className="text-base text-muted-foreground mt-1">
                  {user.phone || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Detalii cont
            </h3>
            <p className="text-muted-foreground">
              Pentru actualizarea adresei de email și parolei, mergi la
              secțiunea{' '}
              <Link
                href="/account?tab=settings"
                className="font-bold text-[var(--link-green)] text-base leading-6 underline hover:text-[var(--link-green-hover)]"
              >
                Securitate și setări
              </Link>
            </p>
          </div>

          <div className="bg-card p-6 border border-gray-300 rounded-none">
            <div>
              <p className="text-lg font-bold text-foreground">Email</p>
              <p className="text-base text-muted-foreground mt-1">
                {user.email || '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersTab() {
  const { fetchOrders } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      const fetchedOrders = await fetchOrders()
      setOrders(fetchedOrders)
      setIsLoading(false)
    }
    loadOrders()
  }, [fetchOrders])

  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };


  if (isLoading)
    return <p className="text-muted-foreground">Se încarcă comenzile...</p>

  return (
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Istoric Comenzi
      </h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Nu ai nicio comandă.</p>
      ) : (
        <>
          <div className="space-y-4">
            {currentOrders.map((order) => {
              const orderId = order.id.split('/').pop();
              const date = new Date(order.processedAt);
              const formattedDate = new Intl.DateTimeFormat('ro-RO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(date);
              const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

              return (
                <div
                  key={order.id}
                  className="bg-card p-6 border border-gray-300 rounded-none"
                >
                  <div className="flex items-center">
                    <div className="font-barlow text-2xl text-gray-800" style={{ color: 'rgb(51, 51, 51)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '24px', lineHeight: '28px', fontWeight: 400 }}>
                      {capitalizedDate}
                    </div>
                    <div className="border-l border-gray-300 h-12 mx-4"></div>
                    <div className="flex-grow">
                      <p className="font-barlow" style={{ color: 'rgb(112, 112, 112)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '20px', fontWeight: 400 }}>
                        Comanda nr:{' '}
                        <span style={{ fontWeight: 600 }}>{order.orderNumber}</span>
                      </p>
                      <p className="font-barlow" style={{ color: 'rgb(112, 112, 112)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '20px', fontWeight: 400 }}>
                        Total:{' '}
                        <span style={{ fontWeight: 600 }}>
                          {order.totalPrice.amount} LEI
                        </span>
                      </p>
                      {order.successfulFulfillments && order.successfulFulfillments.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="mb-1">
                            {order.fulfillmentStatus === 'FULFILLED' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Expediat
                              </span>
                            )}
                            {order.fulfillmentStatus === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                În curs de livrare
                              </span>
                            )}
                          </div>
                          {order.successfulFulfillments.map((fulfillment, index) => (
                            <div key={index} className="font-barlow" style={{ color: 'rgb(112, 112, 112)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '20px', fontWeight: 400 }}>
                              <span style={{ fontWeight: 600 }}>{fulfillment.trackingCompany}: </span>
                              {fulfillment.trackingInfo && fulfillment.trackingInfo.length > 0 ? (
                                <a
                                  href={fulfillment.trackingInfo[0].url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-blue-600"
                                >
                                  {fulfillment.trackingInfo[0].number}
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/account/orders/${orderId}`}
                      className="flex items-center font-barlow no-underline hover:underline uppercase"
                      style={{
                        fontFamily: 'Barlow, Arial, Helvetica, sans-serif',
                        fontWeight: 600,
                        color: 'rgb(51, 51, 51)',
                        fontSize: '15px',
                        lineHeight: '15px'
                      }}
                    >
                      Vezi detaliile comenzii
                      <ChevronRight size={20} className="ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              {
                Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`mx-1 px-3 py-1 rounded-md ${currentPage === index + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))
              }
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AddressesTab({ user }: { user: User }) {
  const { addAddress, updateAddress, deleteAddress, setDefaultAddress } =
    useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);


  const addresses = useMemo(
    () => user.addresses?.edges?.map((e: any) => e.node) || [],
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

  const openDeleteModal = (id: string) => {
    if (id === user.defaultAddress?.id) {
      setIsInfoModalOpen(true);
    } else {
      setAddressToDelete(id);
      setIsDeleteModalOpen(true);
    }
  };

  const closeDeleteModal = () => {
    setAddressToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (addressToDelete) {
      await deleteAddress(addressToDelete);
      closeDeleteModal();
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
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      {isFormOpen ? (
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
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Adrese Salvate
            </h2>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
            >
              <PlusCircle size={20} />
              <span>Adaugă Adresă Nouă</span>
            </button>
          </div>
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-muted-foreground">Nu ai nicio adresă salvată.</p>
            ) : (
              addresses.map((address: Address) => (
                <div
                  key={address.id}
                  className={`border p-4 flex flex-col ${user.defaultAddress?.id === address.id ? 'border-gray-500 border-2' : 'border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2 text-foreground">
                        {address.company || 'Adresă'}
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
                  </div>
                  <div className="flex gap-4 items-center mt-4">
                    {user.defaultAddress?.id === address.id ? (
                      <button
                        disabled
                        className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-none border-2 border-green-600 text-lg"
                      >
                        <Check size={20} />
                        Adresă preferată
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
                      >
                        Setează ca preferată
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
                    >
                      <Edit size={20} /> Editează
                    </button>
                    <button
                      onClick={() => openDeleteModal(address.id)}
                      className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-none border-2 border-red-600 hover:bg-red-600 text-lg cursor-pointer"
                    >
                      <Trash2 size={20} /> Șterge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Confirmă ștergerea"
        message="Ești sigur că vrei să ștergi această adresă?"
      />
      <ConfirmationModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Acțiune nepermisă"
        message="Nu poți șterge adresa preferată. Te rugăm să setezi o altă adresă ca preferată înainte de a o șterge pe aceasta."
        type="info"
      />
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
    <>
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        {address ? 'Editează Adresa' : 'Adaugă Adresă Nouă'}
      </h2>

      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-lg cursor-pointer"
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-none border-2 border-primary hover:bg-primary-dark text-lg cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Se salvează...' : 'Salvează Adresa'}
          </button>
        </div>
      </form>
    </>
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
        className={`w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:bg-secondary ${error ? 'border-red-500' : 'border-muted'
          }`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function PaymentTab() {
  return (
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        Metode de plată
      </h2>
      <div>
        <p className="font-medium">Gestionează metodele de plată la finalizarea comenzii</p>
        <p className="text-sm mt-1">
          Pentru securitatea ta, metodele de plată pot fi adăugate, modificate
          sau șterse în timpul procesului de finalizare a comenzii.
        </p>
      </div>
    </div>
  )
}