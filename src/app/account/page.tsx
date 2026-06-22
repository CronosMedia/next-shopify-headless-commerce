'use client'
import {Suspense, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation' // Added useRouter and useSearchParams, and Router type
import {
  User as UserIcon,
  Package,
  MapPin,
  CreditCard,
  LogOut,
  Edit,
  PlusCircle,
  Trash2,
  AlertCircle,
  ChevronRight,
  Settings, // Added for Security & Settings
  HelpCircle, // Added for Help Center
  Check, // Added for checked icon
  Receipt,
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
import { SearchableSelect } from '@/components/common/SearchableSelect'
import { getLocalitiesForCounty, RO_COUNTIES, getCanonicalCounty, getCanonicalLocality, getPostalCodeForCountyAndLocality } from '@/lib/ro-address'
import ConfirmationModal from '@/components/ConfirmationModal'
import { useToast } from '@/components/ToastProvider'

export default function AccountPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AccountPageContent />
    </Suspense>
  )
}

function AccountPageContent() {
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

  if (loading) {
    return (
      <AuthFormSkeleton
        mode={searchParams.get('mode') === 'register' ? 'register' : 'login'}
      />
    )
  }
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

function AuthPageShell({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center px-4 py-10 sm:py-16">
      {children}
    </div>
  )
}

function AuthCard({children}: {children: React.ReactNode}) {
  return (
    <div className="w-full max-w-[420px] rounded-lg bg-background p-8 shadow-lg">
      {children}
    </div>
  )
}

function SkeletonBlock({className}: {className: string}) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />
}

type AuthMode = 'login' | 'register'

function AuthFieldSkeleton() {
  return (
    <div>
      <SkeletonBlock className="mb-1 h-5 w-20" />
      <SkeletonBlock className="h-12 w-full rounded-none" />
    </div>
  )
}

function AuthFormSkeleton({mode = 'login'}: {mode?: AuthMode}) {
  const fieldCount = mode === 'register' ? 4 : 2

  return (
    <AuthPageShell>
      <AuthCard>
        <SkeletonBlock
          className={`mx-auto mb-6 h-8 ${mode === 'register' ? 'w-44' : 'w-40'}`}
        />
        <div className="space-y-4">
          {Array.from({length: fieldCount}, (_, index) => (
            <AuthFieldSkeleton key={index} />
          ))}
          <SkeletonBlock className="h-[42px] w-full rounded-none" />
        </div>
        <SkeletonBlock className="mx-auto mt-4 h-5 w-48" />
      </AuthCard>
    </AuthPageShell>
  )
}

function AuthForm() {
  const { login, register, loading } = useAuth()
  const { cart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register')
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'register')
  }, [searchParams])

  const handleModeChange = () => {
    const nextIsLogin = !isLogin
    const params = new URLSearchParams(searchParams.toString())

    if (nextIsLogin) {
      params.delete('mode')
    } else {
      params.set('mode', 'register')
    }

    const queryString = params.toString()
    router.replace(queryString ? `/account?${queryString}` : '/account', {scroll: false})
    setIsLogin(nextIsLogin)
    setError(null)
  }

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
    <AuthPageShell>
      <AuthCard>
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
            inputPlaceholder="Parola ta"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
          />
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full cursor-pointer bg-black text-white py-2 px-4 rounded-none border border-black hover:bg-neutral-900 transition-all disabled:opacity-50"
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
              onClick={handleModeChange}
              className="cursor-pointer text-primary hover:underline"
            >
              {isLogin ? 'Înregistrează-te' : 'Autentifică-te'}
            </button>
          </p>
        </div>
      </AuthCard>
    </AuthPageShell>
  )
}

function Sidebar({ activeTab, setActiveTab, onLogout, router }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void, router: ReturnType<typeof useRouter> }) {
  const accountManagementItems = [
    { id: 'profile', label: 'Detalii personale', icon: UserIcon },
    { id: 'orders', label: 'Istoric comenzi', icon: Package },
    { id: 'payment', label: 'Metode de plată', icon: CreditCard },
    { id: 'addresses', label: 'Adrese', icon: MapPin },
    { id: 'billing', label: 'Date de facturare', icon: Receipt },
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
              className={`absolute top-0 h-full w-2 bg-black -left-4 transform origin-left transition-all duration-300 ease-in-out ${activeTab === item.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
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
        {renderedActiveTab === 'billing' && <BillingTab />}
        {renderedActiveTab === 'payment' && <PaymentTab />}
        {renderedActiveTab === 'settings' && <SettingsTab user={user} />}
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: User }) {
  const { refetchUser } = useAuth();
  const { showToast } = useToast();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'A apărut o eroare.');
      }
      showToast('Adresa de email a fost schimbată cu succes.');
      setIsEditingEmail(false);
      refetchUser();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }
    try {
      const response = await fetch('/api/account', {
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
      showToast('Parola a fost schimbată cu succes.');
      setIsEditingPassword(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare.');
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
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-none border-2 border-black hover:bg-neutral-900 text-lg cursor-pointer disabled:opacity-50"
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
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-none border-2 border-black hover:bg-neutral-900 text-lg cursor-pointer disabled:opacity-50"
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
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-none border-2 border-black hover:bg-neutral-900 text-lg cursor-pointer disabled:opacity-50"
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
                className="font-bold text-black text-base leading-6 underline hover:opacity-80"
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
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-primary border border-border">
                                Expediat
                              </span>
                            )}
                            {order.fulfillmentStatus === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-black border border-border">
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
                                  className="hover:underline text-black font-semibold"
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
                    className={`mx-1 px-3 py-1 rounded-none border transition-colors ${currentPage === index + 1
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-neutral-800 border-gray-300 hover:border-black hover:text-black'
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
    () => user.addresses?.edges?.map(({node}) => node) || [],
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
                        className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-none border-2 border-black text-lg"
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

    if (formData.province) {
      const currentCountyObj = romanianCounties.find(c => c.code === formData.province)
      const countyName = currentCountyObj ? getCanonicalCounty(currentCountyObj.name) : ''
      if (!countyName || !RO_COUNTIES.includes(countyName)) {
        newErrors.province = 'Te rugăm să selectezi un județ valid.'
      } else {
        const localitiesList = getLocalitiesForCounty(countyName)
        const canonicalCity = getCanonicalLocality(countyName, formData.city || '')
        if (!localitiesList.some(l => l.name === canonicalCity)) {
          newErrors.city = 'Te rugăm să selectezi o localitate validă.'
        }
      }
    }

    if (formData.zip && !/^[0-9]{6}$/.test(formData.zip)) {
      newErrors.zip = 'Codul poștal trebuie să fie compus din exact 6 cifre.'
    }

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

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Județ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.province}
              onChange={(e) => {
                const nextProvince = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  province: nextProvince,
                  city: '',
                  zip: '',
                }))
              }}
              className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary h-[48px]"
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
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Localitate <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={formData.city}
              options={(() => {
                const currentCountyObj = romanianCounties.find(c => c.code === formData.province)
                const countyName = currentCountyObj ? getCanonicalCounty(currentCountyObj.name) : ''
                return countyName ? getLocalitiesForCounty(countyName).map(l => l.name) : []
              })()}
              disabled={!formData.province}
              placeholder={formData.province ? "Alege localitatea" : "Selectează județul întâi"}
              inputClassName="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-black/20 focus:border-black h-[48px]"
              onChange={(nextCity) => {
                setFormData((prev) => ({
                  ...prev,
                  city: nextCity,
                }))
              }}
              onSelect={(nextCity) => {
                const currentCountyObj = romanianCounties.find(c => c.code === formData.province)
                const countyName = currentCountyObj ? getCanonicalCounty(currentCountyObj.name) : ''
                if (countyName) {
                  const canonical = getCanonicalLocality(countyName, nextCity)
                  const code = getPostalCodeForCountyAndLocality(countyName, canonical)
                  setFormData((prev) => ({
                    ...prev,
                    city: canonical,
                    zip: code || prev.zip,
                  }))
                }
              }}
            />
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city}</p>
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
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-none border-2 border-black hover:bg-neutral-900 text-lg cursor-pointer disabled:opacity-50"
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
  inputPlaceholder,
  value,
  onChange,
  error,
  className = '',
  type = 'text',
  required = false,
  disabled = false,
}: {
  placeholder: string
  inputPlaceholder?: string
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
        placeholder={inputPlaceholder || placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-black/20 focus:border-black disabled:opacity-50 disabled:bg-secondary ${error ? 'border-red-500' : 'border-muted'
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

type BillingType = 'personal' | 'business'
type BillingProfile = {
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

function BillingTab() {
  const [profiles, setProfiles] = useState<BillingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnafLoading, setIsAnafLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [profileIdToDelete, setProfileIdToDelete] = useState<string | null>(null)
  const { showToast } = useToast()

  const [formData, setFormData] = useState<BillingProfile>({
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

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/account/billing')
      if (!res.ok) throw new Error('Nu am putut încărca datele de facturare.')
      const data = await res.json()
      setProfiles(data.billingProfiles || [])
    } catch {
      // Fallback to localStorage
      const local = localStorage.getItem('local_billing_profiles')
      if (local) {
        try {
          setProfiles(JSON.parse(local))
        } catch {
          setProfiles([])
        }
      } else {
        setProfiles([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData.alias.trim()) {
      setError('Denumirea profilului este obligatorie.')
      setIsSubmitting(false)
      return
    }
    if (formData.type === 'personal') {
      if (!formData.firstName || !formData.lastName) {
        setError('Prenumele și numele sunt obligatorii.')
        setIsSubmitting(false)
        return
      }
    } else {
      if (!formData.companyName || !formData.cui) {
        setError('Numele companiei și CUI-ul sunt obligatorii.')
        setIsSubmitting(false)
        return
      }
    }
    if (!formData.address || !formData.city || !formData.province || !formData.zip) {
      setError('Adresa completă este obligatorie.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/account/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          profile: formData,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Eroare la salvare.')

      showToast('Datele de facturare au fost salvate cu succes!')
      setProfiles(data.billingProfiles || [])
      setIsAdding(false)
    } catch {
      // Fallback: Save to localStorage instead
      let nextProfiles = [...profiles]
      if (formData.id) {
        nextProfiles = nextProfiles.map((p) => (p.id === formData.id ? formData : p))
      } else {
        const newProfile = {
          ...formData,
          id: `billing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        }
        nextProfiles.push(newProfile)
      }
      localStorage.setItem('local_billing_profiles', JSON.stringify(nextProfiles))
      setProfiles(nextProfiles)
      showToast('Datele de facturare au fost salvate cu succes!')
      setIsAdding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!profileIdToDelete) return
    const id = profileIdToDelete
    setIsDeleteModalOpen(false)
    setProfileIdToDelete(null)
    setError(null)
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
      setProfiles(data.billingProfiles || [])
    } catch {
      // Fallback: Delete from localStorage
      const nextProfiles = profiles.filter((p) => p.id !== id)
      localStorage.setItem('local_billing_profiles', JSON.stringify(nextProfiles))
      setProfiles(nextProfiles)
      showToast('Profilul de facturare a fost șters.')
    }
  }

  const handleAnafLookup = async () => {
    const cleanCui = formData.cui?.replace(/\s+/g, '')
    if (!cleanCui || !/^\d{2,10}$/.test(cleanCui)) {
      setError('CUI invalid. Completează cu un cod cifric valid.')
      return
    }

    setIsAnafLoading(true)
    setError(null)
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

      setFormData((prev) => ({
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
      setError(err instanceof Error ? err.message : 'Nu s-au putut prelua datele.')
    } finally {
      setIsAnafLoading(false)
    }
  }

  const startNew = (type: BillingType) => {
    setError(null)
    setFormData({
      alias: '',
      type,
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
    setIsAdding(true)
  }

  const startEdit = (profile: BillingProfile) => {
    setError(null)
    setFormData(profile)
    setIsAdding(true)
  }

  const localities = useMemo(() => getLocalitiesForCounty(formData.province), [formData.province])

  return (
    <div className="bg-card p-6 border border-gray-300 rounded-none">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Date de facturare</h2>
        {!isAdding && (
          <div className="flex gap-2">
            <button
              onClick={() => startNew('personal')}
              className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 border-2 border-gray-400 hover:bg-gray-100 text-sm font-semibold cursor-pointer transition-all"
            >
              <PlusCircle size={16} /> Persoană Fizică
            </button>
            <button
              onClick={() => startNew('business')}
              className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 border-2 border-gray-400 hover:bg-gray-100 text-sm font-semibold cursor-pointer transition-all"
            >
              <PlusCircle size={16} /> Persoană Juridică
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : isAdding ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nume profil facturare (ex. Factura mea, Firma mea) *
              </label>
              <input
                type="text"
                required
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="ex. Factură Principală"
              />
            </div>

            {formData.type === 'personal' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prenume *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nume *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">CUI / CIF *</label>
                    <input
                      type="text"
                      required
                      value={formData.cui || ''}
                      onChange={(e) => setFormData({ ...formData, cui: e.target.value })}
                      className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Fără RO"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={isAnafLoading || !formData.cui}
                      onClick={handleAnafLookup}
                      className="w-full bg-black text-white py-2 px-4 border-2 border-black hover:bg-neutral-900 transition-all text-base font-bold disabled:opacity-50 cursor-pointer h-[46px] flex items-center justify-center rounded-none"
                    >
                      {isAnafLoading ? 'Se verifică...' : 'Preia din ANAF'}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nume Companie *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Registrul Comerțului</label>
                  <input
                    type="text"
                    value={formData.regCom || ''}
                    onChange={(e) => setFormData({ ...formData, regCom: e.target.value })}
                    className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="J40/12345/2026"
                  />
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isVatPayer || false}
                      onChange={(e) => setFormData({ ...formData, isVatPayer: e.target.checked })}
                      className="h-5 w-5 border-gray-400 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 font-semibold">Plătitor TVA</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isEInvoiceActive || false}
                      onChange={(e) => setFormData({ ...formData, isEInvoiceActive: e.target.checked })}
                      className="h-5 w-5 border-gray-400 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 font-semibold">RO e-Factura activ</span>
                  </label>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Adresă de facturare *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Strada, număr, bloc, ap."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Județ *</label>
              <SearchableSelect
                value={formData.province}
                options={RO_COUNTIES}
                placeholder="Alege județul"
                inputClassName="px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                onChange={(nextProvince) => {
                  setFormData((prev) => ({
                    ...prev,
                    province: nextProvince,
                    city: prev.province !== nextProvince ? '' : prev.city,
                    zip: prev.province !== nextProvince ? '' : prev.zip,
                  }))
                }}
                onSelect={(nextProvince) => {
                  const canonical = getCanonicalCounty(nextProvince)
                  setFormData((prev) => ({
                    ...prev,
                    province: canonical,
                    city: '',
                    zip: '',
                  }))
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Localitate *</label>
              <SearchableSelect
                value={formData.city}
                options={localities.map((l) => l.name)}
                disabled={!formData.province}
                placeholder={formData.province ? "Alege localitatea" : "Selectează județul întâi"}
                inputClassName="px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                onChange={(nextCity) => {
                  setFormData((prev) => ({ ...prev, city: nextCity }))
                }}
                onSelect={(nextCity) => {
                  const canonical = getCanonicalLocality(formData.province, nextCity)
                  const code = getPostalCodeForCountyAndLocality(formData.province, canonical)
                  setFormData((prev) => ({
                    ...prev,
                    city: canonical,
                    zip: code || prev.zip,
                  }))
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cod Poștal *</label>
              <input
                type="text"
                required
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-background border-2 border-gray-400 rounded-none text-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-none border-2 border-gray-400 hover:bg-gray-100 text-base font-semibold cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-none border-2 border-black hover:bg-neutral-900 text-base font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Se salvează...' : 'Salvează Profilul'}
            </button>
          </div>
        </form>
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground">Nu ai niciun profil de facturare salvat.</p>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="border border-gray-300 p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <p className="font-semibold text-foreground text-lg">{profile.alias}</p>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <p>Tip: {profile.type === 'personal' ? 'Persoană Fizică' : 'Persoană Juridică'}</p>
                  {profile.type === 'personal' ? (
                    <p>{profile.firstName} {profile.lastName}</p>
                  ) : (
                    <>
                      <p>{profile.companyName} (CUI: {profile.cui}{profile.regCom ? `, RegCom: ${profile.regCom}` : ''})</p>
                      <p>
                        {profile.isVatPayer ? 'Plătitor TVA' : 'Neplătitor TVA'}
                        {profile.isEInvoiceActive ? ' • RO e-Factura activ' : ''}
                      </p>
                    </>
                  )}
                  <p>{profile.address}, {profile.city}, {profile.province} • {profile.zip}</p>
                  <p>Tel: {profile.phone}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => startEdit(profile)}
                  className="flex items-center gap-1.5 bg-white text-gray-800 px-4 py-2 border border-gray-400 hover:bg-gray-100 text-sm font-semibold cursor-pointer"
                >
                  <Edit size={14} /> Editează
                </button>
                <button
                  onClick={() => {
                    setProfileIdToDelete(profile.id!)
                    setIsDeleteModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2 border border-red-600 hover:bg-red-600 text-sm font-semibold cursor-pointer"
                >
                  <Trash2 size={14} /> Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setProfileIdToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirmă ștergerea"
        message="Ești sigur că vrei să ștergi acest profil de facturare?"
      />
    </div>
  )
}
