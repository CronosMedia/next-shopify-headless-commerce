'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Package, ReceiptText, RefreshCw, Truck} from 'lucide-react'
import {useToast} from '@/components/ToastProvider'
import {AdminLoginForm} from '@/components/admin/AdminLoginForm'
import {
  AdminButton,
  AdminCard,
  AdminLoadingCard,
  AdminShell,
  AdminStatusBadge,
} from '@/components/admin/AdminShell'
import type {AdminOrder, AdminOrdersResponse} from '@/components/admin/types'

type AdminState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
  }).format(Number(amount || 0))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminPage() {
  const [state, setState] = useState<AdminState>('loading')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastWarningToastRef = useRef('')
  const {showToast} = useToast()

  const loadOrders = useCallback(async () => {
    setState('loading')
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
        setError(data.error || 'Nu am putut încărca zona de admin.')
        setState('error')
        return
      }

      setOrders(data.orders || [])
      setState('authenticated')
    } catch {
      setError('A apărut o eroare de rețea.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const summary = useMemo(() => {
    const pendingFulfillment = orders.filter(
      (order) => order.fulfillmentStatus !== 'FULFILLED'
    ).length
    const missingInvoice = orders.filter((order) => !order.invoice).length
    const missingAwb = orders.filter((order) => !order.awb).length
    const revenue = orders.reduce((total, order) => {
      return total + Number(order.total.amount || 0)
    }, 0)

    return {
      total: orders.length,
      pendingFulfillment,
      missingInvoice,
      missingAwb,
      revenue,
      currency: orders[0]?.total.currency || 'RON',
    }
  }, [orders])

  useEffect(() => {
    if (state !== 'authenticated') return
    if (summary.missingInvoice + summary.missingAwb === 0) return

    const warningKey = `${summary.missingInvoice}:${summary.missingAwb}`
    if (lastWarningToastRef.current === warningKey) return

    lastWarningToastRef.current = warningKey
    showToast({
      message: `${summary.missingInvoice} comenzi fără factură și ${summary.missingAwb} fără AWB necesită atenție.`,
      type: 'warning',
      duration: 5000,
    })
  }, [showToast, state, summary.missingAwb, summary.missingInvoice])

  if (state === 'loading') {
    return <AdminLoadingCard />
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
              Administrare magazin
            </h1>
            <p className="mt-2 text-sm text-[#6d7175]">
              {error || 'Zona de admin nu poate fi încărcată.'}
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
      title="Dashboard"
      subtitle="Privire operațională peste comenzi, documente și livrări."
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Package}
            label="Comenzi"
            value={String(summary.total)}
            description="Lista curentă"
          />
          <MetricCard
            icon={Truck}
            label="De expediat"
            value={String(summary.pendingFulfillment)}
            description="Fulfillment deschis"
          />
          <MetricCard
            icon={ReceiptText}
            label="Fără factură"
            value={String(summary.missingInvoice)}
            description="Documente lipsă"
          />
          <MetricCard
            icon={ReceiptText}
            label="Venit listat"
            value={formatCurrency(String(summary.revenue), summary.currency)}
            description="Comenzi încărcate"
          />
        </div>

        <AdminCard>
          <div className="flex items-center justify-between border-b border-[#f1f2f3] px-4 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Ultimele comenzi
              </h2>
              <p className="mt-0.5 text-sm text-[#6d7175]">
                Cele mai recente intrări din Shopify Admin.
              </p>
            </div>
            <AdminButton href="/admin/orders" variant="outline">
              Vezi toate
            </AdminButton>
          </div>
          <div className="space-y-2 p-4">
            {orders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-[#e1e3e5] px-3 py-2.5 text-[15px] md:grid-cols-[minmax(220px,1fr)_220px_150px] md:items-center"
              >
                <div className="min-w-[180px]">
                  <p className="font-semibold text-[#202223]">{order.name}</p>
                  <p className="text-sm text-[#6d7175]">
                    {order.customer.name} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="grid w-full grid-cols-[84px_128px] gap-1.5 md:w-[220px]">
                  <AdminStatusBadge className="w-full justify-center">
                    {order.financialStatus}
                  </AdminStatusBadge>
                  <AdminStatusBadge className="w-full justify-center">
                    {order.fulfillmentStatus}
                  </AdminStatusBadge>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-semibold text-[#202223]">
                    {formatCurrency(order.total.amount, order.total.currency)}
                  </p>
                  <p className="text-[13px] uppercase tracking-wide text-[#6d7175]">
                    {order.invoice ? 'facturată' : 'fără factură'}
                  </p>
                </div>
              </div>
            ))}
            {!orders.length && (
              <p className="py-10 text-center text-[15px] text-[#8c9196]">
                Nu există comenzi de afișat.
              </p>
            )}
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{className?: string}>
  label: string
  value: string
  description: string
}) {
  return (
    <AdminCard className="bg-[#f6f6f7]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] uppercase tracking-[0.14em] text-[#6d7175]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#202223]">
              {value}
            </p>
            <p className="mt-1 text-[13px] text-[#6d7175]">{description}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d2d5d8] bg-white">
            <Icon className="h-4 w-4 text-[#5c5f62]" />
          </div>
        </div>
      </div>
    </AdminCard>
  )
}
