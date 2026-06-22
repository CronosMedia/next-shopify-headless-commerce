'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useEffect, useMemo, useState} from 'react'
import {
  ArrowRight,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Truck,
  X,
} from 'lucide-react'

type AdminShellProps = {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    subtitle: 'Privire generală',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/orders',
    label: 'Comenzi',
    subtitle: 'Facturi și AWB',
    icon: Package,
  },
]

export function AdminShell({children, title, subtitle}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
    })
    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f1f2f4] text-[#202223] [font-family:var(--font-geist),sans-serif]">
      <AdminTopBar
        onOpenSearch={() => setIsCommandOpen(true)}
        onLogout={handleLogout}
      />
      <AdminCommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      <section className="px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside>
            <AdminCard className="overflow-hidden lg:sticky lg:top-20">
              <nav className="p-2">
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mb-1 flex flex-col rounded-lg border px-3 py-2.5 text-left transition-colors last:mb-0 ${
                        isActive
                          ? 'border-[#b3dfd0] bg-[#f0faf6] text-[#202223]'
                          : 'border-transparent text-[#5c5f62] hover:bg-[#f6f6f7] hover:text-[#202223]'
                      }`}
                    >
                      <span
                        className={`flex items-center gap-2 text-[15px] font-semibold leading-snug ${
                          isActive ? 'text-[#008060]' : ''
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </span>
                      <span className="mt-0.5 text-[13px] leading-snug text-[#8c9196]">
                        {item.subtitle}
                      </span>
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-[#f1f2f3] p-2">
                <div className="flex flex-col rounded-lg border border-transparent px-3 py-2.5 text-[#8c9196]">
                  <span className="flex items-center gap-2 text-[15px] font-semibold leading-snug">
                    <FileText className="h-3.5 w-3.5" />
                    Facturi
                  </span>
                  <span className="mt-0.5 text-[13px] leading-snug">
                    SmartBill / Oblio
                  </span>
                </div>
                <div className="flex flex-col rounded-lg border border-transparent px-3 py-2.5 text-[#8c9196]">
                  <span className="flex items-center gap-2 text-[15px] font-semibold leading-snug">
                    <Truck className="h-3.5 w-3.5" />
                    Logistică
                  </span>
                  <span className="mt-0.5 text-[13px] leading-snug">
                    AWB și fulfillment
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full flex-col rounded-lg border border-transparent px-3 py-2.5 text-left text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <span className="flex items-center gap-2 text-[15px] font-semibold leading-snug">
                    <LogOut className="h-3.5 w-3.5" />
                    Deconectare
                  </span>
                  <span className="mt-0.5 text-[13px] leading-snug text-rose-400">
                    Închide sesiunea admin
                  </span>
                </button>
              </div>
            </AdminCard>
          </aside>

          <AdminCard className="overflow-hidden">
            <div className="border-b border-[#f1f2f3] px-6 py-4">
              <h1 className="text-[22px] font-semibold tracking-tight text-[#202223]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-[15px] text-[#6d7175]">{subtitle}</p>
              )}
            </div>
            <div className="p-4 md:p-6">{children}</div>
          </AdminCard>
        </div>

        <AdminCard className="mt-6">
          <div className="px-4 py-2.5">
            <p className="text-xs text-[#8c9196]">
              Sesiune admin securizată cu iron-session. Acțiunile operaționale
              folosesc endpoint-urile admin existente.
            </p>
          </div>
        </AdminCard>
      </section>
    </main>
  )
}

function AdminTopBar({
  onOpenSearch,
  onLogout,
}: {
  onOpenSearch: () => void
  onLogout: () => void
}) {
  return (
    <div className="sticky top-0 z-[200] border-b border-[#2d2f31] bg-[#1a1c1e] text-[#e3e3e3] shadow-sm">
      <div className="flex h-14 w-full items-center gap-4 px-4">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5 hover:opacity-90">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[#4a4d51] text-[10px] font-bold text-white shadow-inner">
            MO
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#e3e3e3]">
            maison admin
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center px-4 md:flex">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-9 w-full max-w-md items-center justify-start gap-3 rounded-lg border border-[#303337] bg-[#2d2f31]/50 px-3 text-[#8c9196] transition hover:border-[#4a4d51] hover:bg-[#303337]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-sm font-medium">
              Caută acțiuni, comenzi, facturi
            </span>
            <span className="ml-auto flex items-center gap-1 opacity-60">
              <kbd className="rounded border border-[#4a4d51] px-1.5 py-0 text-[10px] font-semibold">
                Ctrl
              </kbd>
              <kbd className="rounded border border-[#4a4d51] px-1.5 py-0 text-[10px] font-semibold">
                K
              </kbd>
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#4a4d51] bg-transparent text-[#e3e3e3] transition hover:bg-[#303133] md:hidden"
            aria-label="Caută"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            href="/"
            className="hidden h-8 items-center justify-center gap-1.5 rounded-md border border-[#4a4d51] bg-transparent px-3 text-xs font-semibold text-[#e3e3e3] transition hover:bg-[#303133] sm:inline-flex"
          >
            <Home className="h-3.5 w-3.5" />
            Magazin
          </Link>
          <div className="hidden h-6 w-px bg-[#4a4d51] sm:block" />
          <button
            type="button"
            onClick={onLogout}
            className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#4a4d51] bg-transparent px-3 text-xs font-semibold text-[#e3e3e3] transition hover:bg-[#303133]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const actions = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        hint: 'Privire generală',
        run: () => router.push('/admin'),
      },
      {
        id: 'orders',
        label: 'Comenzi',
        hint: 'Facturi și AWB',
        run: () => router.push('/admin/orders'),
      },
      {
        id: 'missing-invoices',
        label: 'Comenzi fără factură',
        hint: 'Filtru operațional',
        run: () => router.push('/admin/orders?filter=missing_invoice'),
      },
      {
        id: 'missing-awb',
        label: 'Comenzi fără AWB',
        hint: 'Filtru logistic',
        run: () => router.push('/admin/orders?filter=missing_awb'),
      },
      {
        id: 'storefront',
        label: 'Deschide magazinul',
        hint: 'Maison Outdoor',
        run: () => router.push('/'),
      },
    ],
    [router]
  )

  const filteredActions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return actions
    return actions.filter((action) =>
      `${action.label} ${action.hint}`.toLowerCase().includes(needle)
    )
  }, [actions, query])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const runAction = (run: () => void) => {
    run()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#202223]/35 px-4 pt-[12vh] backdrop-blur-sm">
      <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-[#d2d5d8] bg-white text-[#202223] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#e1e3e5] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#6d7175]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută acțiuni admin..."
            className="h-8 flex-1 bg-transparent text-sm text-[#202223] outline-none placeholder:text-[#8c9196]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d2d5d8] bg-[#f6f6f7] px-2 py-1 text-[10px] font-semibold text-[#6d7175] transition hover:bg-[#eceeef]"
          >
            ESC
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6d7175] transition hover:bg-[#f6f6f7] hover:text-[#202223]"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-[#6d7175]">
                Nu am găsit acțiuni pentru „{query}”.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 text-xs font-semibold text-[#008060] hover:underline"
              >
                Curăță căutarea
              </button>
            </div>
          ) : (
            <div>
              {!query && (
                <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
                  Acțiuni sugerate
                </p>
              )}
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runAction(action.run)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#f6f6f7]"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium leading-snug text-[#202223]">
                      {action.label}
                    </span>
                    <span className="line-clamp-1 text-xs text-[#6d7175]">
                      {action.hint}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8c9196]" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#e1e3e5] bg-[#f6f6f7] px-4 py-2 text-[10px] text-[#6d7175]">
          <span>Command center</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#d2d5d8] bg-white px-1 text-[9px]">
                Ctrl
              </kbd>
              <kbd className="rounded border border-[#d2d5d8] bg-white px-1 text-[9px]">
                K
              </kbd>
              deschide
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded border border-[#d2d5d8] bg-white px-1 text-[9px]">
                ESC
              </kbd>
              închide
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-lg border border-[#d2d5d8] bg-white text-[#202223] shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function AdminLoadingCard({
  variant = 'dashboard',
}: {
  variant?: 'dashboard' | 'orders'
}) {
  return (
    <main className="min-h-screen bg-[#f1f2f4] text-[#202223] [font-family:var(--font-geist),sans-serif]">
      <div className="sticky top-0 z-[200] border-b border-[#2d2f31] bg-[#1a1c1e] text-[#e3e3e3] shadow-sm">
        <div className="flex h-14 w-full items-center gap-4 px-4">
          <div className="h-7 w-7 rounded bg-[#4a4d51]" />
          <div className="h-4 w-28 rounded bg-[#303337]" />
          <div className="mx-auto hidden h-9 w-full max-w-md rounded-lg border border-[#303337] bg-[#2d2f31]/50 md:block" />
          <div className="ml-auto h-8 w-24 rounded-md border border-[#4a4d51] bg-[#303133]" />
          <div className="hidden h-8 w-24 rounded-md border border-[#4a4d51] bg-[#303133] sm:block" />
        </div>
      </div>

      <section className="px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AdminCard className="hidden overflow-hidden lg:block">
            <div className="space-y-2 p-2">
              <SkeletonLine className="h-[60px] rounded-lg" />
              <SkeletonLine className="h-[60px] rounded-lg" />
            </div>
            <div className="space-y-2 border-t border-[#f1f2f3] p-2">
              <SkeletonLine className="h-[54px] rounded-lg" />
              <SkeletonLine className="h-[54px] rounded-lg" />
              <SkeletonLine className="h-[54px] rounded-lg" />
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <div className="border-b border-[#f1f2f3] px-6 py-4">
              <SkeletonLine className="h-7 w-40" />
              <SkeletonLine className="mt-2 h-4 w-80 max-w-full" />
            </div>
            <div className="p-4 md:p-6">
              {variant === 'orders' ? <OrdersSkeleton /> : <DashboardSkeleton />}
            </div>
          </AdminCard>
        </div>

        <AdminCard className="mt-6">
          <div className="px-4 py-2.5">
            <SkeletonLine className="h-3 w-96 max-w-full" />
          </div>
        </AdminCard>
      </section>
    </main>
  )
}

function SkeletonLine({className = ''}: {className?: string}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gradient-to-r from-[#eceeef] via-[#f6f6f7] to-[#eceeef] bg-[length:200%_100%] ${className}`}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonLine className="h-[54px] w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 4}).map((_, index) => (
          <AdminCard key={index} className="bg-[#f6f6f7]">
            <div className="p-4">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="mt-3 h-7 w-20" />
              <SkeletonLine className="mt-3 h-3 w-28" />
            </div>
          </AdminCard>
        ))}
      </div>
      <AdminCard>
        <div className="flex items-center justify-between border-b border-[#f1f2f3] px-4 py-4">
          <div>
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="mt-2 h-3 w-56" />
          </div>
          <SkeletonLine className="h-8 w-20" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({length: 6}).map((_, index) => (
            <SkeletonLine key={index} className="h-[54px] rounded-lg" />
          ))}
        </div>
      </AdminCard>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="mt-2 h-4 w-44" />
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonLine className="h-8 w-64" />
          <SkeletonLine className="h-8 w-48" />
          <SkeletonLine className="h-8 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({length: 10}).map((_, index) => (
          <AdminCard key={index}>
            <div className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[128px_minmax(180px,1fr)_128px_220px_150px_44px] lg:items-center">
              <SkeletonLine className="h-10 w-32" />
              <SkeletonLine className="h-10 min-w-[180px] flex-1" />
              <SkeletonLine className="h-10 w-28" />
              <div className="grid w-full grid-cols-[84px_128px] gap-1.5 sm:w-[220px]">
                <SkeletonLine className="h-6 w-full" />
                <SkeletonLine className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <SkeletonLine className="h-3.5 w-24" />
                <SkeletonLine className="h-3.5 w-20" />
              </div>
              <div className="flex lg:justify-end">
                <SkeletonLine className="h-9 w-9" />
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}

const statusColors: Record<string, string> = {
  paid: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  platita: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  paid_romanian: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  fulfilled: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  livrata: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  factura_emisa: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  awb_emis: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
  unfulfilled: 'border-amber-200 bg-amber-50 text-amber-700',
  nelivrata: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  in_asteptare: 'border-amber-200 bg-amber-50 text-amber-700',
  pending_payment: 'border-amber-200 bg-amber-50 text-amber-700',
  partially_fulfilled: 'border-blue-200 bg-blue-50 text-blue-700',
  partial_livrata: 'border-blue-200 bg-blue-50 text-blue-700',
  refunded: 'border-slate-200 bg-slate-50 text-slate-600',
  rambursata: 'border-slate-200 bg-slate-50 text-slate-600',
  voided: 'border-rose-200 bg-rose-50 text-rose-700',
  anulata: 'border-rose-200 bg-rose-50 text-rose-700',
}

const statusLabels: Record<string, string> = {
  paid: 'Plătită',
  paid_romanian: 'Plătită',
  fulfilled: 'Livrată',
  unfulfilled: 'Nelivrată',
  pending: 'În așteptare',
  pending_payment: 'Plată în așteptare',
  partially_fulfilled: 'Parțial livrată',
  refunded: 'Rambursată',
  voided: 'Anulată',
}

function normalizeStatus(value: React.ReactNode) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

export function AdminStatusBadge({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const normalized = normalizeStatus(children)
  const label = statusLabels[normalized] || children
  const colorClass =
    statusColors[normalized] ||
    'border-[#d2d5d8] bg-[#f1f2f4] text-[#5c5f62]'

  return (
    <span
      className={`inline-flex min-h-6 min-w-max items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${colorClass} ${className}`}
    >
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}

export function AdminMicroSkeleton({
  className = 'h-3 w-12',
}: {
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 animate-pulse rounded bg-gradient-to-r from-[#eceeef] via-[#f6f6f7] to-[#eceeef] bg-[length:200%_100%] ${className}`}
    />
  )
}

export function AdminButtonSkeleton({
  width = 'w-16',
}: {
  width?: string
}) {
  return (
    <span className="inline-flex h-4 items-center gap-1.5">
      <AdminMicroSkeleton className="h-3.5 w-3.5 rounded-sm" />
      <AdminMicroSkeleton className={`h-3 ${width}`} />
    </span>
  )
}

export function AdminButton({
  children,
  disabled,
  href,
  onClick,
  rel,
  target,
  type = 'button',
  variant = 'primary',
}: {
  children: React.ReactNode
  disabled?: boolean
  href?: string
  onClick?: () => void
  rel?: string
  target?: React.HTMLAttributeAnchorTarget
  type?: 'button' | 'submit'
  variant?: 'primary' | 'outline' | 'success' | 'danger'
}) {
  const className = `inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
    variant === 'primary'
      ? 'border-[#008060] bg-[#008060] text-white hover:bg-[#006e52]'
      : variant === 'success'
        ? 'border-[#b3dfd0] bg-white text-[#008060] hover:bg-[#f0faf6]'
        : variant === 'danger'
          ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
          : 'border-[#d2d5d8] bg-white text-[#202223] hover:bg-[#f6f6f7]'
  }`

  if (href) {
    return (
      <Link href={href} className={className} rel={rel} target={target}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}
