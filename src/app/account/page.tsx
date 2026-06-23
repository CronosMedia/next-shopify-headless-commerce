'use client'
import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation' // Added useRouter and useSearchParams, and Router type
import {
  User as UserIcon,
  Package,
  MapPin,
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
  Eye,
  EyeOff,
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

const accountTabIds = ['profile', 'orders', 'addresses', 'billing', 'settings', 'help']

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <AccountPageContent />
    </Suspense>
  )
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedInitialTab = searchParams.get('tab')
  const initialTab = requestedInitialTab && accountTabIds.includes(requestedInitialTab)
    ? requestedInitialTab
    : 'profile'
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();

  const handleLogout = async () => {
    await logout(cart?.id)
    router.push('/logout')
  }

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && !accountTabIds.includes(tab)) {
      setActiveTab('profile')
      router.replace('/account?tab=profile', {scroll: false})
      return
    }

    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab, router]);

  if (loading) {
    const isAuthRoute = searchParams.get('mode') === 'register' || searchParams.get('redirect')

    return isAuthRoute ? (
      <AuthFormSkeleton
        mode={searchParams.get('mode') === 'register' ? 'register' : 'login'}
      />
    ) : (
      <AccountPageSkeleton />
    )
  }
  if (!user) return <AuthForm />

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-6 sm:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-light uppercase tracking-[0.1em] text-foreground md:text-3xl">
            Salutare {user.firstName}!
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
            Bine ai venit în contul tău.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-red-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 transition-colors hover:border-red-500 hover:bg-red-50"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Deconectare
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
    <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center px-4 pb-28 pt-10 sm:py-16">
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

function AccountPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-6 sm:p-6" aria-hidden="true">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <SkeletonBlock className="mb-3 h-8 w-64 max-w-full" />
          <SkeletonBlock className="h-5 w-48 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>

      <div className="lg:hidden -mx-4 mb-6 border-y border-[var(--border)] bg-[var(--background)] py-4">
        <SkeletonBlock className="mx-4 mb-3 h-3 w-36" />
        <div className="flex gap-2 overflow-hidden px-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-10 w-32 shrink-0" />
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <aside className="hidden border-t border-[var(--border)] pt-5 lg:block">
          <SkeletonBlock className="mb-4 h-3 w-36" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-3">
          <div className={accountPanelClass}>
            <SkeletonBlock className="mb-6 h-6 w-48" />
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={accountSectionClass}>
                  <SkeletonBlock className="mb-3 h-3 w-24" />
                  <SkeletonBlock className="h-5 w-56 max-w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type AuthMode = 'login' | 'register'

const accountPanelClass =
  'border border-[var(--border)] bg-white p-5 md:p-6 lg:p-8'
const accountSectionClass =
  'border border-[var(--border)] bg-[#F9F8F6]/45 p-4 md:p-5'
const accountTitleClass =
  'text-lg md:text-xl font-light uppercase tracking-[0.08em] text-[var(--foreground)]'
const accountLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]'
const accountPrimaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 bg-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300'
const accountSecondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--border)] bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition-colors hover:border-black hover:bg-[#F9F8F6]'
const accountDangerButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-red-200 bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 transition-colors hover:border-red-500 hover:bg-red-50'
const accountInputClass =
  'w-full min-h-12 border border-[var(--border)] bg-white px-3 py-2 text-base text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-black disabled:bg-[var(--secondary)] disabled:opacity-60'

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
  const errorRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

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
    if (isSubmitting || loading) return

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
        setError(apiError.error.message || 'Emailul sau parola nu sunt corecte. Verifică datele și încearcă din nou.')
      } else {
        const redirectPath = searchParams.get('redirect')
        router.push(redirectPath?.startsWith('/') ? redirectPath : '/account')
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
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 outline-none"
            >
              {error}
            </div>
          )}
          {!isLogin && (
            <>
              <InputField
                name="given-name"
                autoComplete="given-name"
                placeholder="Prenume"
                value={formData.firstName}
                onChange={(val) => setFormData({ ...formData, firstName: val })}
              />
              <InputField
                name="family-name"
                autoComplete="family-name"
                placeholder="Nume"
                value={formData.lastName}
                onChange={(val) => setFormData({ ...formData, lastName: val })}
              />
            </>
          )}
          <InputField
            name="email"
            autoComplete="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
            required
            invalid={Boolean(error)}
          />
          <InputField
            name="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            type="password"
            placeholder="Parolă"
            inputPlaceholder="Parola ta"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
            required
            invalid={Boolean(error)}
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

function Sidebar({ activeTab, setActiveTab, router }: { activeTab: string, setActiveTab: (tab: string) => void, router: ReturnType<typeof useRouter> }) {
  const mobileNavRef = useRef<HTMLElement | null>(null)
  const mobileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const accountManagementItems = [
    { id: 'profile', label: 'Detalii personale', icon: UserIcon },
    { id: 'orders', label: 'Istoric comenzi', icon: Package },
    { id: 'addresses', label: 'Adrese', icon: MapPin },
    { id: 'billing', label: 'Date de facturare', icon: Receipt },
    { id: 'settings', label: 'Securitate și setări', icon: Settings },
    { id: 'help', label: 'Ajutor', icon: HelpCircle },
  ]

  const getCenteredScrollLeft = useCallback((nav: HTMLElement, item: HTMLElement) => {
    const centeredLeft = item.offsetLeft - (nav.clientWidth - item.clientWidth) / 2
    const maxScrollLeft = nav.scrollWidth - nav.clientWidth

    return Math.max(0, Math.min(centeredLeft, maxScrollLeft))
  }, [])

  const centerMobileTab = useCallback((tabId: string, behavior: ScrollBehavior = 'smooth') => {
    const nav = mobileNavRef.current
    const item = mobileTabRefs.current[tabId]

    if (!nav || !item || !window.matchMedia('(max-width: 1023px)').matches) {
      return
    }

    nav.scrollTo({
      left: getCenteredScrollLeft(nav, item),
      behavior,
    })
  }, [getCenteredScrollLeft])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    window.requestAnimationFrame(() => centerMobileTab(tabId))
    router.push(`/account?tab=${tabId}`, { scroll: false })
  }

  return (
    <>
      <div className="lg:hidden -mx-4 mb-6 border-y border-[var(--border)] bg-[var(--background)] py-4">
        <p className="px-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Administrare cont
        </p>
        <nav
          ref={mobileNavRef}
          className="flex max-w-full gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navigație cont"
        >
          {accountManagementItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                ref={(node) => {
                  mobileTabRefs.current[item.id] = node
                }}
                type="button"
                onClick={() => handleTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-10 shrink-0 items-center gap-2 border px-3 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-[var(--border)] bg-white text-[var(--foreground)] hover:border-black'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <aside className="hidden lg:col-span-1 lg:block border-t border-[var(--border)] pt-5">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Administrare cont
        </h2>
        <nav className="mb-9 grid gap-1">
          {accountManagementItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`relative flex min-h-12 w-full items-center gap-3 border-l px-4 text-left text-[13px] font-semibold uppercase tracking-[0.075em] transition-colors ${
                  isActive
                    ? 'border-black bg-[var(--secondary)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--foreground)]/80 hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={17} strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

      </aside>
    </>
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
    <div className="min-w-0 pb-24 lg:col-span-3 lg:pb-0">
      <div key={activeTab}> {/* Key prop to force re-render */}
        {renderedActiveTab === 'profile' && <ProfileTab user={user} />}
        {renderedActiveTab === 'orders' && <OrdersTab />}
        {renderedActiveTab === 'addresses' && <AddressesTab user={user} />}
        {renderedActiveTab === 'billing' && <BillingTab />}
        {renderedActiveTab === 'settings' && <SettingsTab user={user} />}
        {renderedActiveTab === 'help' && <AccountHelpTab />}
      </div>
    </div>
  );
}

function AccountHelpTab() {
  const helpItems = [
    {
      title: 'Comenzi și livrare',
      text: 'Urmărește statusul comenzilor din istoric și verifică adresele salvate înainte de checkout.',
      href: '/account?tab=orders',
      action: 'Vezi comenzile',
    },
    {
      title: 'Retururi',
      text: 'Ai 14 zile pentru retur. Păstrează produsul în starea în care l-ai primit și pregătește numărul comenzii.',
    },
    {
      title: 'Date cont',
      text: 'Actualizează emailul, parola sau datele personale fără să părăsești zona de cont.',
      href: '/account?tab=settings',
      action: 'Deschide setările',
    },
  ]

  return (
    <div className={accountPanelClass}>
      <div className="mb-6">
        <h2 className={accountTitleClass}>Ajutor cont</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Găsești rapid cele mai utile direcții fără să ieși din cont. Pentru situații punctuale, ne poți scrie din pagina de contact.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {helpItems.map((item) => {
          const content = (
            <>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.text}
                </p>
              </div>
              {item.href ? (
                <span className="mt-5 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                  {item.action}
                  <ChevronRight size={15} className="ml-1 transition-transform group-hover:translate-x-1" />
                </span>
              ) : (
                <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Informație utilă
                </span>
              )}
            </>
          )

          return item.href ? (
            <Link
              key={item.title}
              href={item.href}
              className="group flex min-h-40 flex-col justify-between border border-[var(--border)] bg-[#F9F8F6]/45 p-5 transition-colors hover:border-black hover:bg-white"
            >
              {content}
            </Link>
          ) : (
            <article
              key={item.title}
              className="flex min-h-40 flex-col justify-between border border-[var(--border)] bg-[#F9F8F6]/45 p-5"
            >
              {content}
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            Ai nevoie de un răspuns direct?
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Folosește detaliile comenzii sau datele din cont când ne contactezi, ca să putem verifica rapid situația.
          </p>
        </div>
      </div>
    </div>
  )
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
    <div className={accountPanelClass}>
      <div className="mb-6">
        <h2 className={accountTitleClass}>Securitate și setări</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Gestionează datele folosite pentru autentificare și accesul la cont.
        </p>
      </div>
      {error && (
        <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        <section className="py-5 md:px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h3 className={accountLabelClass}>Adresă de email</h3>
              <p className="mt-2 break-words text-base text-[var(--foreground)]">
                {user.email}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Folosită pentru autentificare și notificări despre comenzi.
              </p>
            </div>
            {!isEditingEmail && (
              <button
                onClick={() => setIsEditingEmail(true)}
                className={`${accountSecondaryButtonClass} w-full sm:w-auto md:min-w-36`}
              >
                <Edit size={16} strokeWidth={1.5} /> Editează
              </button>
            )}
          </div>
          {isEditingEmail && (
            <form onSubmit={handleEmailChange} className="mt-5 max-w-xl space-y-4">
              <InputField
                placeholder="Adresă de email nouă"
                value={email}
                onChange={setEmail}
                type="email"
                required
              />
              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className={accountSecondaryButtonClass}
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className={accountPrimaryButtonClass}
                >
                  Salvează
                </button>
              </div>
            </form>
          )}
        </section>
        <section className="py-5 md:px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h3 className={accountLabelClass}>Parolă</h3>
              <p className="mt-2 text-base text-[var(--foreground)]">••••••••</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Actualizează parola pentru a păstra contul în siguranță.
              </p>
            </div>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className={`${accountSecondaryButtonClass} w-full sm:w-auto md:min-w-36`}
              >
                <Edit size={16} strokeWidth={1.5} /> Editează
              </button>
            )}
          </div>
          {isEditingPassword && (
            <form onSubmit={handlePasswordChange} className="mt-5 max-w-xl space-y-4">
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
              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  className={accountSecondaryButtonClass}
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className={accountPrimaryButtonClass}
                >
                  Salvează
                </button>
              </div>
            </form>
          )}
        </section>
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
    <div className={accountPanelClass}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={accountTitleClass}>
          Detaliile mele
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={accountSecondaryButtonClass}
          >
            <Edit size={16} strokeWidth={1.5} /> Editează
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
            inputPlaceholder="ex. 0747000000"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
          />
          <p className="-mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Poți introduce numărul în format românesc, de exemplu 0747000000.
          </p>
          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={accountSecondaryButtonClass}
            >
              Anulează
            </button>
             <button
              type="submit"
              disabled={isSubmitting}
              className={accountPrimaryButtonClass}
            >
              {isSubmitting ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          <div className={accountSectionClass}>
            <div className="space-y-4 divide-y divide-[var(--border)]">
              <div className="pt-4 first:pt-0">
                <p className={accountLabelClass}>Prenume</p>
                <p className="text-base text-muted-foreground mt-1">
                  {user.firstName || '-'}
                </p>
              </div>
              <div className="pt-4">
                <p className={accountLabelClass}>Nume</p>
                <p className="text-base text-muted-foreground mt-1">
                  {user.lastName || '-'}
                </p>
              </div>
              <div className="pt-4">
                <p className={accountLabelClass}>Telefon</p>
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

          <div className={accountSectionClass}>
            <div>
              <p className={accountLabelClass}>Email</p>
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


  if (isLoading) {
    return <OrdersTabSkeleton />
  }

  return (
    <div className={accountPanelClass}>
      <h2 className={`${accountTitleClass} mb-6`}>
        Istoric Comenzi
      </h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Nu ai nicio comandă.</p>
      ) : (
        <>
          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
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
                  className="group py-5 transition-colors hover:bg-[#F9F8F6]/55 md:px-4"
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Data comenzii
                      </p>
                      <p className="mt-2 text-lg font-light uppercase tracking-[0.06em] text-[var(--foreground)] md:text-xl">
                        {capitalizedDate}
                      </p>
                    </div>

                    <div className="min-w-0 border-l-0 border-[var(--border)] md:border-l md:pl-5">
                      <dl className="grid grid-cols-2 gap-3 text-sm leading-6 md:block md:space-y-1">
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)] md:sr-only">
                            Comanda
                          </dt>
                          <dd className="text-[var(--muted-foreground)]">
                            Nr. <span className="font-semibold text-[var(--foreground)]">{order.orderNumber}</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)] md:sr-only">
                            Total
                          </dt>
                          <dd className="text-[var(--muted-foreground)]">
                            Total <span className="font-semibold text-[var(--foreground)]">{order.totalPrice.amount} LEI</span>
                          </dd>
                        </div>
                      </dl>
                      {order.successfulFulfillments && order.successfulFulfillments.length > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                          <div className="mb-2">
                            {order.fulfillmentStatus === 'FULFILLED' && (
                              <span className="inline-flex items-center border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
                                Expediat
                              </span>
                            )}
                            {order.fulfillmentStatus === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
                                În curs de livrare
                              </span>
                            )}
                          </div>
                          {order.successfulFulfillments.map((fulfillment, index) => (
                            <div key={index} className="text-sm leading-6 text-[var(--muted-foreground)]">
                              <span className="font-semibold text-[var(--foreground)]">{fulfillment.trackingCompany}: </span>
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
                      className="inline-flex min-h-10 items-center justify-between gap-2 border border-[var(--border)] bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:border-black md:justify-center"
                    >
                      Detalii
                      <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
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

function OrdersTabSkeleton() {
  return (
    <div className={accountPanelClass} aria-hidden="true">
      <SkeletonBlock className="mb-6 h-6 w-44" />
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="py-5 md:px-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] md:items-center">
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-6 w-56 max-w-full" />
              </div>
              <div className="space-y-2 md:border-l md:border-[var(--border)] md:pl-5">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
              <SkeletonBlock className="h-10 w-full md:w-28" />
            </div>
          </div>
        ))}
      </div>
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
    <div className={accountPanelClass}>
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={accountTitleClass}>
              Adrese Salvate
            </h2>
            <button
              onClick={handleAddNew}
              className={accountPrimaryButtonClass}
            >
              <PlusCircle size={16} strokeWidth={1.5} />
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
                  className={`flex flex-col border p-4 md:p-5 ${user.defaultAddress?.id === address.id ? 'border-black bg-[#F9F8F6]' : 'border-[var(--border)] bg-white'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
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
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    {user.defaultAddress?.id === address.id ? (
                      <button
                        disabled
                        className={accountSecondaryButtonClass}
                      >
                        <Check size={16} strokeWidth={1.5} />
                        Adresă preferată
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className={accountSecondaryButtonClass}
                      >
                        Setează ca preferată
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className={accountSecondaryButtonClass}
                    >
                      <Edit size={16} strokeWidth={1.5} /> Editează
                    </button>
                    <button
                      onClick={() => openDeleteModal(address.id)}
                      className={accountDangerButtonClass}
                    >
                      <Trash2 size={16} strokeWidth={1.5} /> Șterge
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
      <h2 className={`${accountTitleClass} mb-5`}>
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
            inputPlaceholder="ex. 0747000000"
            type="tel"
            autoComplete="tel"
            value={formData.phone || ''}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            error={errors.phone}
            className="md:col-span-2"
          />
          <p className="-mt-2 text-sm leading-6 text-[var(--muted-foreground)] md:col-span-2">
            Acceptăm formatul românesc, de exemplu 0747000000.
          </p>
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
              className={accountInputClass}
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
              inputClassName={accountInputClass}
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
        <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className={accountSecondaryButtonClass}
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={accountPrimaryButtonClass}
          >
            {isSubmitting ? 'Se salvează...' : 'Salvează Adresa'}
          </button>
        </div>
      </form>
    </>
  )
}

function InputField({
  name,
  placeholder,
  inputPlaceholder,
  value,
  onChange,
  error,
  invalid = false,
  className = '',
  type = 'text',
  autoComplete,
  required = false,
  disabled = false,
}: {
  name?: string
  placeholder: string
  inputPlaceholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  invalid?: boolean
  className?: string
  type?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
}) {
  const inputId = `account-${name || placeholder.toLowerCase().replace(/\s+/g, '-')}`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-muted-foreground mb-1">
        {placeholder}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          placeholder={inputPlaceholder || placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          required={required}
          disabled={disabled}
          spellCheck={false}
          inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
          aria-invalid={invalid || Boolean(error)}
          className={`w-full min-h-12 px-3 py-2 ${isPassword ? 'pr-12' : ''} bg-background border-2 rounded-none text-base md:text-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-black/20 focus:border-black disabled:opacity-50 disabled:bg-secondary ${invalid || error ? 'border-red-500' : 'border-gray-400'
            }`}
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
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
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
      setProfiles([])
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nu am putut salva datele de facturare.')
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nu am putut șterge profilul de facturare.')
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
    <div className={accountPanelClass}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={accountTitleClass}>Date de facturare</h2>
        {!isAdding && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => startNew('personal')}
              className={accountSecondaryButtonClass}
            >
              <PlusCircle size={16} /> Persoană Fizică
            </button>
            <button
              onClick={() => startNew('business')}
              className={accountPrimaryButtonClass}
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

      <p className="mb-5 border border-[var(--border)] bg-[#F9F8F6]/45 px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]">
        Plata este gestionată securizat în checkout-ul Shopify.
      </p>

      {loading ? (
        <div className="space-y-4 py-2" aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className={accountSectionClass}>
              <SkeletonBlock className="mb-3 h-4 w-40" />
              <SkeletonBlock className="mb-2 h-3 w-56" />
              <SkeletonBlock className="h-3 w-72 max-w-full" />
            </div>
          ))}
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
                className={accountInputClass}
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
                    className={accountInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nume *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={accountInputClass}
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
                      className={accountInputClass}
                      placeholder="Fără RO"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={isAnafLoading || !formData.cui}
                      onClick={handleAnafLookup}
                      className={`${accountPrimaryButtonClass} w-full`}
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
                    className={accountInputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Registrul Comerțului</label>
                  <input
                    type="text"
                    value={formData.regCom || ''}
                    onChange={(e) => setFormData({ ...formData, regCom: e.target.value })}
                    className={accountInputClass}
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
                className={accountInputClass}
                placeholder="Strada, număr, bloc, ap."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Județ *</label>
              <SearchableSelect
                value={formData.province}
                options={RO_COUNTIES}
                placeholder="Alege județul"
                inputClassName={accountInputClass}
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
                inputClassName={accountInputClass}
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
                className={accountInputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                required
                autoComplete="tel"
                placeholder="ex. 0747000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={accountInputClass}
              />
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                Poți folosi formatul 0747000000.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={accountSecondaryButtonClass}
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={accountPrimaryButtonClass}
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
            <div
              key={profile.id || `${profile.type}-${profile.alias}-${profile.cui || profile.phone}`}
              className="min-w-0 border border-[var(--border)] bg-white p-4 md:p-5"
            >
              <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {profile.type === 'personal' ? 'Persoană fizică' : 'Persoană juridică'}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                    {profile.alias}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => startEdit(profile)}
                    className={`${accountSecondaryButtonClass} w-full sm:w-auto`}
                  >
                    <Edit size={14} /> Editează
                  </button>
                  <button
                    onClick={() => {
                      setProfileIdToDelete(profile.id!)
                      setIsDeleteModalOpen(true)
                    }}
                    className={`${accountDangerButtonClass} w-full sm:w-auto`}
                  >
                    <Trash2 size={14} /> Șterge
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4 text-sm leading-6 text-muted-foreground">
                <div>
                  <p className={accountLabelClass}>Tip</p>
                  <p>{profile.type === 'personal' ? 'Persoană Fizică' : 'Persoană Juridică'}</p>
                </div>
                <div>
                  {profile.type === 'personal' ? (
                    <>
                      <p className={accountLabelClass}>Nume</p>
                      <p>{profile.firstName} {profile.lastName}</p>
                    </>
                  ) : (
                    <>
                      <p className={accountLabelClass}>Firmă</p>
                      <p className="break-words text-[var(--foreground)]">{profile.companyName}</p>
                      <p className="mt-1">CUI: {profile.cui}{profile.regCom ? `, Reg. Com.: ${profile.regCom}` : ''}</p>
                      <p className="mt-1">
                        {profile.isVatPayer ? 'Plătitor TVA' : 'Neplătitor TVA'}
                        {profile.isEInvoiceActive ? ' • RO e-Factura activ' : ''}
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <p className={accountLabelClass}>Adresă</p>
                  <p className="break-words">{profile.address}, {profile.city}, {profile.province} • {profile.zip}</p>
                </div>
                <div>
                  <p className={accountLabelClass}>Telefon</p>
                  <p>{profile.phone}</p>
                </div>
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
