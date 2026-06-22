'use client'

import {Suspense, useCallback, useEffect, useMemo, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {
  ExternalLink,
  FileText,
  MoreHorizontal,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import {useToast} from '@/components/ToastProvider'
import {AdminLoginForm} from '@/components/admin/AdminLoginForm'
import {
  AdminButton,
  AdminButtonSkeleton,
  AdminCard,
  AdminLoadingCard,
  AdminMicroSkeleton,
  AdminShell,
  AdminStatusBadge,
} from '@/components/admin/AdminShell'
import type {AdminOrder, AdminOrdersResponse} from '@/components/admin/types'

type AdminState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
type ActionName = 'invoice' | 'awb'

type ActionState = {
  orderId: string
  action: ActionName
} | null

type AdminActionResponse = {
  success?: boolean
  alreadyIssued?: boolean
  mode?: 'demo' | 'real'
  fulfilled?: boolean
  message?: string
  invoice?: {
    status: 'issued' | 'simulated' | 'error'
    provider?: string
    number?: string
    series?: string
    pdfUrl?: string
    issuedAt?: string
  }
  awb?: {
    status: 'issued' | 'simulated' | 'error'
    provider?: string
    code?: string
    trackingUrl?: string
    issuedAt?: string
  }
  error?: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
  }).format(Number(amount || 0))
}

function getNumericOrderId(orderId: string) {
  return orderId.split('/').pop() || orderId
}

function parseInvoiceParts(order: AdminOrder) {
  const rawSeries = order.invoice?.series?.trim() || 'DEMO'
  const rawNumber = order.invoice?.number?.trim() || ''
  const normalizedSeries = rawSeries || 'DEMO'
  const prefixedNumberPattern = new RegExp(
    `^${normalizedSeries.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`,
    'i'
  )
  const numberWithoutSeries = rawNumber.replace(prefixedNumberPattern, '').trim()

  if (numberWithoutSeries) {
    return {
      series: normalizedSeries,
      number: numberWithoutSeries,
    }
  }

  const splitNumber = rawNumber.match(/^([A-Za-z]+)\s+(.+)$/)

  if (splitNumber) {
    return {
      series: splitNumber[1],
      number: splitNumber[2],
    }
  }

  return {
    series: normalizedSeries,
    number: rawNumber === 'N/A' ? '' : rawNumber,
  }
}

function getInvoiceQuery(order: AdminOrder) {
  const query = new URLSearchParams()
  const {series, number} = parseInvoiceParts(order)

  if (series) {
    query.set('series', series)
  }

  if (number) {
    query.set('number', number)
  }

  return query.toString()
}

function getInvoiceHref(order: AdminOrder) {
  const numericOrderId = getNumericOrderId(order.id)
  const query = getInvoiceQuery(order)

  return `/invoice/download/${encodeURIComponent(numericOrderId)}${
    query ? `?${query}` : ''
  }`
}

function getInvoicePdfHref(order: AdminOrder) {
  const numericOrderId = getNumericOrderId(order.id)
  const query = getInvoiceQuery(order)

  return `/invoice/download/${encodeURIComponent(numericOrderId)}/pdf${
    query ? `?${query}` : ''
  }`
}

function matchesStatus(order: AdminOrder, status: string) {
  if (!status) return true
  if (status === 'missing_invoice') return !order.invoice
  if (status === 'missing_awb') return !order.awb
  return (
    order.financialStatus.toLowerCase() === status ||
    order.fulfillmentStatus.toLowerCase() === status
  )
}

function getInvoiceLabel(order: AdminOrder) {
  if (!order.invoice) return 'Fără factură'
  if (order.invoice.status === 'simulated' || order.invoice.provider === 'demo') {
    return 'Factură demo'
  }
  return 'Factură emisă'
}

function getAwbLabel(order: AdminOrder) {
  if (!order.awb) return 'Fără AWB'
  if (order.awb.status === 'simulated' || order.awb.provider === 'demo') {
    return 'AWB demo'
  }
  return 'AWB generat'
}

function getActionSuccessMessage(action: ActionName, data: AdminActionResponse) {
  if (data.message) return data.message

  if (action === 'invoice') {
    if (data.alreadyIssued) return 'Factura era deja emisă.'
    return data.mode === 'demo'
      ? 'Factură demo emisă.'
      : 'Factura a fost emisă.'
  }

  if (data.alreadyIssued) return 'AWB-ul era deja generat.'
  return data.mode === 'demo'
    ? 'AWB demo generat. Comanda nu a fost marcată ca expediată.'
    : 'AWB-ul a fost generat.'
}

function DocumentStatus({
  busy,
  label,
  tone,
}: {
  busy: boolean
  label: string
  tone: 'success' | 'muted'
}) {
  if (busy) {
    return (
      <span className="flex h-5 items-center">
        <AdminMicroSkeleton className="h-3.5 w-24 rounded-sm" />
      </span>
    )
  }

  return (
    <span className="flex h-5 items-center gap-2 text-[#5c5f62]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === 'success' ? 'bg-[#008060]' : 'bg-[#aeb4b9]'
        }`}
      />
      <span className="whitespace-nowrap font-medium">{label}</span>
    </span>
  )
}

function OrderDetailsDrawer({
  actionState,
  getNumericOrderId,
  onClose,
  onRunAction,
  order,
}: {
  actionState: ActionState
  getNumericOrderId: (orderId: string) => string
  onClose: () => void
  onRunAction: (order: AdminOrder, action: ActionName) => void
  order: AdminOrder | null
}) {
  if (!order) return null

  const invoiceBusy =
    actionState?.orderId === order.id && actionState.action === 'invoice'
  const awbBusy =
    actionState?.orderId === order.id && actionState.action === 'awb'
  const orderBusy = actionState?.orderId === order.id
  const numericOrderId = getNumericOrderId(order.id)
  const invoiceHref = getInvoiceHref(order)
  const invoicePdfHref = getInvoicePdfHref(order)

  return (
    <div className="fixed inset-0 z-[450] bg-[#202223]/25" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-[#d2d5d8] bg-white text-[#202223] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e1e3e5] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7175]">
              Comandă
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {order.name}
            </h2>
            <p className="mt-1 text-sm text-[#6d7175]">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d2d5d8] text-[#5c5f62] transition hover:bg-[#f6f6f7] hover:text-[#202223]"
            aria-label="Închide detaliile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Client
            </p>
            <p className="mt-2 text-sm font-semibold">{order.customer.name}</p>
            <p className="mt-1 text-sm text-[#6d7175]">
              {order.customer.email || 'Email indisponibil'}
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Sumar
            </p>
            <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] px-3 py-2">
              <span className="text-sm text-[#6d7175]">Total</span>
              <span className="text-sm font-bold">
                {formatCurrency(order.total.amount, order.total.currency)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[84px_128px] gap-1.5">
              <AdminStatusBadge className="w-full justify-center">
                {order.financialStatus}
              </AdminStatusBadge>
              <AdminStatusBadge className="w-full justify-center">
                {order.fulfillmentStatus}
              </AdminStatusBadge>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Documente
            </p>
            <div className="mt-2 space-y-2 rounded-lg border border-[#e1e3e5] px-3 py-3">
              <DocumentStatus
                busy={invoiceBusy}
                label={getInvoiceLabel(order)}
                tone={order.invoice ? 'success' : 'muted'}
              />
              {order.invoice?.number && (
                <p className="pl-3.5 text-xs text-[#6d7175]">
                  Nr. {order.invoice.number}
                </p>
              )}
              <DocumentStatus
                busy={awbBusy}
                label={getAwbLabel(order)}
                tone={order.awb ? 'success' : 'muted'}
              />
              {order.awb && (
                <p className="pl-3.5 text-xs text-[#6d7175]">
                  {order.awb.courier} {order.awb.code}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-2 border-t border-[#e1e3e5] bg-[#f6f6f7] px-5 py-4">
          <AdminButton href={`/admin/orders/${numericOrderId}`} variant="outline">
            <ExternalLink className="h-3.5 w-3.5" />
            Detalii comandă
          </AdminButton>
          {order.invoice ? (
            <AdminButton
              href={invoiceHref}
              rel="noopener noreferrer"
              target="_blank"
              variant="outline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Deschide factura
            </AdminButton>
          ) : (
            <AdminButton
              disabled={orderBusy}
              onClick={() => onRunAction(order, 'invoice')}
              variant="success"
            >
              {invoiceBusy ? (
                <AdminButtonSkeleton width="w-20" />
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Emite factură
                </>
              )}
            </AdminButton>
          )}
          {order.invoice ? (
            <AdminButton
              href={invoicePdfHref}
              rel="noopener noreferrer"
              target="_blank"
              variant="outline"
            >
              <FileText className="h-3.5 w-3.5" />
              Descarcă PDF
            </AdminButton>
          ) : null}
          {order.awb?.trackingUrl ? (
            <AdminButton
              href={order.awb.trackingUrl}
              rel="noopener noreferrer"
              target="_blank"
              variant="outline"
            >
              <Truck className="h-3.5 w-3.5" />
              Tracking AWB
            </AdminButton>
          ) : null}
          {order.invoice?.url ? (
            <AdminButton
              href={order.invoice.url}
              rel="noopener noreferrer"
              target="_blank"
              variant="outline"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF provider
            </AdminButton>
          ) : null}
          <AdminButton
            disabled={orderBusy || Boolean(order.awb)}
            onClick={() => onRunAction(order, 'awb')}
            variant="outline"
          >
            {awbBusy ? (
              <AdminButtonSkeleton width="w-20" />
            ) : order.awb ? (
              <>
                <PackageCheck className="h-3.5 w-3.5" />
                AWB generat
              </>
            ) : (
              <>
                <Truck className="h-3.5 w-3.5" />
                Generează AWB
              </>
            )}
          </AdminButton>
        </div>
      </aside>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminLoadingCard variant="orders" />}>
      <AdminOrdersPageContent />
    </Suspense>
  )
}

function AdminOrdersPageContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<AdminState>('loading')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionState, setActionState] = useState<ActionState>(null)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const {showToast} = useToast()
  const ordersPerPage = 10

  const loadOrders = useCallback(async (mode: 'initial' | 'soft' = 'initial') => {
    if (mode === 'soft') {
      setIsRefreshing(true)
    } else {
      setState('loading')
    }
    setError(null)

    try {
      const response = await fetch('/api/admin/orders', {
        cache: 'no-store',
      })

      if (response.status === 401) {
        setState('unauthenticated')
        setOrders([])
        return
      }

      const data = (await response.json()) as AdminOrdersResponse

      if (!response.ok) {
        setError(data.error || 'Nu am putut încărca comenzile.')
        setState('error')
        return
      }

      setOrders(data.orders || [])
      setState('authenticated')
    } catch {
      setError('A apărut o eroare de rețea.')
      setState('error')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const filter = searchParams.get('filter') || ''
    setStatusFilter(filter)
    setCurrentPage(1)
  }, [searchParams])

  useEffect(() => {
    if (!selectedOrder) return

    const updatedOrder = orders.find((order) => order.id === selectedOrder.id)
    if (updatedOrder && updatedOrder !== selectedOrder) {
      setSelectedOrder(updatedOrder)
    }
  }, [orders, selectedOrder])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return orders.filter((order) => {
      const haystack = [
        order.name,
        order.customer.name,
        order.customer.email,
        order.invoice?.number || '',
        order.awb?.code || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch) && matchesStatus(order, statusFilter)
    })
  }, [orders, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage))
  const visibleOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage
    return filteredOrders.slice(start, start + ordersPerPage)
  }, [currentPage, filteredOrders])

  const runOrderAction = async (order: AdminOrder, action: ActionName) => {
    setActionState({orderId: order.id, action})

    try {
      const response = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({orderId: order.id}),
      })
      const data = (await response.json()) as AdminActionResponse

      if (!response.ok || !data.success) {
        showToast({
          message: data.error || 'Operațiunea nu a putut fi finalizată.',
          type: 'error',
        })
        return
      }

      showToast({
        message: getActionSuccessMessage(action, data),
        type: 'success',
      })
      await loadOrders('soft')
    } catch {
      showToast({
        message: 'A apărut o eroare de rețea.',
        type: 'error',
      })
    } finally {
      setActionState(null)
    }
  }

  if (state === 'loading') {
    return <AdminLoadingCard variant="orders" />
  }

  if (state === 'unauthenticated') {
    return <AdminLoginForm onSuccess={loadOrders} />
  }

  if (state === 'error') {
    return (
      <main className="min-h-screen bg-[#f1f2f4] px-4 py-10 text-[#202223] [font-family:var(--font-geist),sans-serif]">
        <AdminCard className="mx-auto max-w-md">
          <div className="p-8 text-center">
            <h1 className="text-lg font-semibold text-[#202223]">
              Comenzi admin
            </h1>
            <p className="mt-2 text-sm text-[#6d7175]">
              {error || 'Comenzile nu pot fi încărcate.'}
            </p>
            <div className="mt-6">
              <AdminButton onClick={loadOrders}>
                <RefreshCw className="h-3.5 w-3.5" />
                Reîncearcă
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </main>
    )
  }

  return (
    <AdminShell
      title="Comenzi"
      subtitle="Status plată, facturi și AWB pentru comenzile Shopify."
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-[#202223]">
              Comenzi
            </h2>
            <div className="mt-0.5 flex h-5 items-center gap-1 text-[15px] text-[#6d7175]">
              {isRefreshing ? (
                <>
                  <AdminMicroSkeleton className="h-3 w-8" />
                  <span>rezultate din</span>
                  <AdminMicroSkeleton className="h-3 w-8" />
                  <span>comenzi.</span>
                </>
              ) : (
                <span>
                  {filteredOrders.length} rezultate din {orders.length} comenzi.
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6d7175]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Caută comandă, client, AWB"
                className="h-9 w-64 max-w-full rounded-md border border-[#aeb4b9] bg-white pl-9 pr-3 text-[15px] text-[#202223] outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-48 rounded-md border border-[#aeb4b9] bg-white px-3 text-[15px] text-[#202223] outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/20"
            >
              <option value="">Toate statusurile</option>
              <option value="paid">Plătite</option>
              <option value="pending">În așteptare</option>
              <option value="fulfilled">Livrate</option>
              <option value="unfulfilled">Nelivrate</option>
              <option value="missing_invoice">Fără factură</option>
              <option value="missing_awb">Fără AWB</option>
            </select>
            <AdminButton
              disabled={isRefreshing}
              onClick={() => loadOrders('soft')}
              variant="outline"
            >
              {isRefreshing ? (
                <AdminButtonSkeleton width="w-12" />
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </>
              )}
            </AdminButton>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <AdminCard>
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-semibold text-[#202223]">
                Nu există comenzi pentru filtrul curent.
              </p>
              <p className="text-xs text-[#6d7175]">
                Ajustează căutarea sau statusul selectat.
              </p>
            </div>
          </AdminCard>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleOrders.map((order) => {
              const invoiceBusy =
                actionState?.orderId === order.id &&
                actionState.action === 'invoice'
              const awbBusy =
                actionState?.orderId === order.id && actionState.action === 'awb'

              return (
                <AdminCard
                  key={order.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[128px_minmax(180px,1fr)_128px_220px_150px_44px] lg:items-center">
                    <div>
                      <p className="text-base font-bold text-[#202223]">
                        {order.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8c9196]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#202223]">
                        {order.customer.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                        {order.customer.email || 'Email indisponibil'}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-base font-bold text-[#202223]">
                        {formatCurrency(order.total.amount, order.total.currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[#6d7175]">
                        {order.total.currency}
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-[84px_128px] gap-1.5 sm:w-[220px]">
                      <AdminStatusBadge className="w-full justify-center">
                        {order.financialStatus}
                      </AdminStatusBadge>
                      <AdminStatusBadge className="w-full justify-center">
                        {order.fulfillmentStatus}
                      </AdminStatusBadge>
                    </div>

                    <div className="space-y-1.5 text-[13px]">
                      <DocumentStatus
                        busy={invoiceBusy}
                        label={getInvoiceLabel(order)}
                        tone={order.invoice ? 'success' : 'muted'}
                      />
                      <DocumentStatus
                        busy={awbBusy}
                        label={getAwbLabel(order)}
                        tone={order.awb ? 'success' : 'muted'}
                      />
                    </div>

                    <div className="flex items-center lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d2d5d8] bg-white text-[#202223] transition hover:bg-[#f6f6f7]"
                        aria-label={`Deschide acțiuni pentru ${order.name}`}
                        title="Mai multe"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </AdminCard>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            {Array.from({length: totalPages}, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`mx-1 h-8 min-w-8 rounded-md border px-2 text-xs font-semibold transition-colors ${
                  currentPage === index + 1
                    ? 'border-[#008060] bg-[#008060] text-white'
                    : 'border-[#d2d5d8] bg-white text-[#202223] hover:bg-[#f6f6f7]'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <OrderDetailsDrawer
        actionState={actionState}
        getNumericOrderId={getNumericOrderId}
        onClose={() => setSelectedOrder(null)}
        onRunAction={runOrderAction}
        order={selectedOrder}
      />
    </AdminShell>
  )
}
