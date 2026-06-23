'use client'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {ChevronLeft} from 'lucide-react'

// Type updated to use product featuredImage
type AdminOrder = {
  id: string
  name: string
  tags: string[]
  legacyResourceId: string
  processedAt: string
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  shippingAddress: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    province: string
    zip: string
    country: string
    company?: string
  } | null
  billingAddress: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    province: string
    zip: string
    country: string
    company?: string
  } | null
  customAttributes: Array<{ key: string; value: string }>
  subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
  totalShippingPriceSet: { shopMoney: { amount: string; currencyCode: string } }
  totalTaxSet: { shopMoney: { amount: string; currencyCode: string } }
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
  lineItems: {
    nodes: {
      id: string
      title: string
      quantity: number
      variant: {
        price: string
        image: {
          url: string
          altText: string
          width: number
          height: number
        } | null
        product: {
          handle: string
        }
      } | null
      product: {
        // Changed to featuredImage
        featuredImage: {
          url: string
          altText: string
          width: number
          height: number
        } | null
      } | null
    }[]
  }
  fulfillment?: {
    trackingCompany: string
    trackingInfo?: {
      number: string
      url: string
    }
  } | null
  invoicePdfUrl?: string | null
  invoiceNumber?: string | null
  awbCode?: string | null
  courierName?: string | null
}

function OrderDetailsSkeletonBlock({className}: {className: string}) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />
}

function OrderDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:p-6" aria-hidden="true">
      <OrderDetailsSkeletonBlock className="mb-6 h-5 w-52" />

      <div className="mb-6 border border-gray-300 bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-muted pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <OrderDetailsSkeletonBlock className="h-7 w-56 max-w-full" />
            <div className="hidden h-12 border-l border-gray-300 md:block" />
            <div className="space-y-2">
              <OrderDetailsSkeletonBlock className="h-4 w-36" />
              <OrderDetailsSkeletonBlock className="h-4 w-28" />
            </div>
          </div>
          <OrderDetailsSkeletonBlock className="h-10 w-36" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex gap-4 border-b border-muted pb-4 last:border-b-0 last:pb-0">
              <OrderDetailsSkeletonBlock className="h-20 w-20 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <OrderDetailsSkeletonBlock className="h-4 w-64 max-w-full" />
                <OrderDetailsSkeletonBlock className="h-4 w-28" />
                <OrderDetailsSkeletonBlock className="h-4 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="border border-gray-300 bg-card p-5 sm:p-6">
            <OrderDetailsSkeletonBlock className="mb-4 h-5 w-40" />
            <div className="space-y-2">
              <OrderDetailsSkeletonBlock className="h-4 w-48 max-w-full" />
              <OrderDetailsSkeletonBlock className="h-4 w-56 max-w-full" />
              <OrderDetailsSkeletonBlock className="h-4 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellationState, setCancellationState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  useEffect(() => {
    if (!id) return

    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const searchParams = window.location.search;
        const response = await fetch(`/api/account/orders/${id}${searchParams}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error?.message || 'Failed to fetch order details.'
          )
        }

        setOrder(data.order)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unknown error occurred.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id])

  const handleRequestCancellation = async () => {
    if (!order) return

    setCancellationState('sending')
    try {
      const response = await fetch('/api/orders/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send cancellation request.')
      }

      setCancellationState('sent')
    } catch {
      setCancellationState('error')
    }
  }

  if (loading) {
    return <OrderDetailsSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
        <Link
          href="/account?tab=orders"
          className="mt-4 inline-block text-primary hover:underline"
        >
          &larr; Înapoi la contul meu
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Comanda nu a fost găsită.</p>
        <Link
          href="/account?tab=orders"
          className="mt-4 inline-block text-primary hover:underline"
        >
          &larr; Înapoi la contul meu
        </Link>
      </div>
    )
  }

  const getAttr = (key: string) => order.customAttributes?.find((a) => a.key === key)?.value || ''
  const hasCustomBilling = getAttr('Factură solicitată') === 'Da'
  const isFirm = getAttr('Facturare pe firmă') === 'Da'

  const formattedDate = new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(order.processedAt));
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const financialStatusText =
    order.displayFinancialStatus === 'PAID'
      ? 'Plătită'
      : order.displayFinancialStatus === 'PENDING'
        ? 'În așteptare'
        : order.displayFinancialStatus === 'REFUNDED'
          ? 'Rambursată'
          : order.displayFinancialStatus === 'VOIDED'
            ? 'Anulată'
            : order.displayFinancialStatus

  const fulfillmentStatusText =
    order.displayFulfillmentStatus === 'FULFILLED'
      ? 'Expediată'
      : order.displayFulfillmentStatus === 'UNFULFILLED'
        ? 'Neexpediată'
        : order.displayFulfillmentStatus === 'IN_PROGRESS'
          ? 'În procesare'
          : order.displayFulfillmentStatus === 'ON_HOLD'
            ? 'În așteptare'
            : order.displayFulfillmentStatus === 'OPEN'
              ? 'Deschisă'
              : order.displayFulfillmentStatus === 'PARTIALLY_FULFILLED'
                ? 'Parțial expediată'
                : order.displayFulfillmentStatus

  const financialStatusClass =
    order.displayFinancialStatus === 'PAID'
      ? 'text-green-700'
      : order.displayFinancialStatus === 'VOIDED' || order.displayFinancialStatus === 'REFUNDED'
        ? 'text-red-700'
        : 'text-amber-700'

  const fulfillmentStatusClass =
    order.displayFulfillmentStatus === 'FULFILLED'
      ? 'text-green-700'
      : order.displayFulfillmentStatus === 'IN_PROGRESS'
        ? 'text-blue-700'
        : 'text-amber-700'

  const detailSectionClass =
    'border-b border-[var(--border)] py-5 last:border-b-0 md:border md:bg-white md:p-5'
  const detailLabelClass =
    'mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]'
  const detailTextClass = 'space-y-1 text-sm leading-6 text-[var(--muted-foreground)]'

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:p-6">
      <Link
        href="/account?tab=orders"
        className="mb-6 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] underline-offset-4 hover:underline"
      >
        <ChevronLeft size={18} className="mr-1" />
        Înapoi la istoric comenzi
      </Link>

      <section className="mb-8 border-b border-[var(--border)] pb-5 md:border md:bg-white md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Comanda {order.name}
            </p>
            <h1 className="text-2xl font-light uppercase tracking-[0.06em] text-[var(--foreground)] md:text-3xl">
              {capitalizedDate}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              Total:{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {formatMoney(order.totalPriceSet.shopMoney.amount, order.totalPriceSet.shopMoney.currencyCode)}
              </span>
            </p>
          </div>

          {order.tags.includes('Cancellation Rejected') ? (
            <span className="inline-flex min-h-10 items-center justify-center border border-red-200 bg-red-50 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
              Cerere respinsă
            </span>
          ) : order.tags.includes('Cancellation Requested') || cancellationState === 'sent' ? (
            <span className="inline-flex min-h-10 items-center justify-center border border-amber-200 bg-amber-50 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Cerere trimisă
            </span>
          ) : cancellationState === 'idle' ? (
            <button
              onClick={handleRequestCancellation}
              className="inline-flex min-h-10 items-center justify-center border border-[var(--border)] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition-colors hover:border-black"
            >
              Cerere de anulare
            </button>
          ) : cancellationState === 'sending' ? (
            <span className="text-sm leading-6 text-[var(--muted-foreground)]">Se trimite cererea...</span>
          ) : cancellationState === 'error' ? (
            <span className="text-sm leading-6 text-red-600">Eroare la trimiterea cererii.</span>
          ) : null}
        </div>
      </section>

      <div className="mb-8 grid gap-0 md:grid-cols-3 md:gap-4">
        <section className={detailSectionClass}>
          <h2 className={detailLabelClass}>
              Adresa de livrare
          </h2>
            {order.shippingAddress ? (
            <div className={detailTextClass}>
                {order.shippingAddress.company && (
                <p className="font-semibold text-[var(--foreground)]">{order.shippingAddress.company}</p>
                )}
                <p>
                  {order.shippingAddress.firstName}{' '}
                  {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                  {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Nu a fost furnizată nicio adresă de expediere.
              </p>
            )}
        </section>

        <section className={detailSectionClass}>
          <h2 className={detailLabelClass}>
              Detalii facturare
          </h2>
          <div className={detailTextClass}>
              {(() => {
                if (hasCustomBilling) {
                  const tipFacturare = getAttr('Tip Facturare')
                  const companyName = getAttr('Denumire Firmă')
                  const cui = getAttr('Cod Unic de Înregistrare (CUI)')
                  const regCom = getAttr('Număr Registrul Comerțului')
                  const tva = getAttr('TVA')
                  const eInvoice = getAttr('e-Invoice')
                  const numeFacturare = getAttr('Nume Facturare')
                  const adresaFacturare = getAttr('Adresă Facturare')

                  if (isFirm) {
                    return (
                      <>
                      <p><span className="font-medium text-[var(--foreground)]">Tip factură:</span> Persoană Juridică</p>
                        {companyName && (
                        <p><span className="font-medium text-[var(--foreground)]">Firma:</span> {companyName}</p>
                        )}
                        {cui && (
                        <p><span className="font-medium text-[var(--foreground)]">CUI:</span> {cui}</p>
                        )}
                        {regCom && (
                        <p><span className="font-medium text-[var(--foreground)]">Reg. Com.:</span> {regCom}</p>
                        )}
                        {tva && (
                        <p><span className="font-medium text-[var(--foreground)]">Plătitor TVA:</span> {tva}</p>
                        )}
                        {eInvoice && (
                        <p><span className="font-medium text-[var(--foreground)]">e-Factura:</span> {eInvoice === 'Da' ? 'Da' : 'Nu'}</p>
                        )}
                        {adresaFacturare && (
                        <p><span className="font-medium text-[var(--foreground)]">Adresă facturare:</span> {adresaFacturare}</p>
                        )}
                      </>
                    )
                  } else if (tipFacturare === 'Persoană Fizică (Adresă Livrare)') {
                    return (
                      <>
                      <p><span className="font-medium text-[var(--foreground)]">Tip factură:</span> Persoană Fizică</p>
                        <p className="italic text-xs text-neutral-500">(Coincide cu adresa de livrare)</p>
                        {order.shippingAddress ? (
                          <>
                            <p>
                              {order.shippingAddress.firstName}{' '}
                              {order.shippingAddress.lastName}
                            </p>
                            <p>{order.shippingAddress.address1}</p>
                            {order.shippingAddress.address2 && (
                              <p>{order.shippingAddress.address2}</p>
                            )}
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                              {order.shippingAddress.zip}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                          </>
                        ) : order.billingAddress ? (
                          <>
                            <p>
                              {order.billingAddress.firstName}{' '}
                              {order.billingAddress.lastName}
                            </p>
                            <p>{order.billingAddress.address1}</p>
                            {order.billingAddress.address2 && (
                              <p>{order.billingAddress.address2}</p>
                            )}
                            <p>
                              {order.billingAddress.city}, {order.billingAddress.province}{' '}
                              {order.billingAddress.zip}
                            </p>
                            <p>{order.billingAddress.country}</p>
                          </>
                        ) : (
                          <p>Aceleași detalii ca la livrare.</p>
                        )}
                      </>
                    )
                  } else {
                    return (
                      <>
                      <p><span className="font-medium text-[var(--foreground)]">Tip factură:</span> Persoană Fizică</p>
                        {numeFacturare && (
                        <p><span className="font-medium text-[var(--foreground)]">Nume:</span> {numeFacturare}</p>
                        )}
                        {adresaFacturare && (
                        <p><span className="font-medium text-[var(--foreground)]">Adresă facturare:</span> {adresaFacturare}</p>
                        )}
                      </>
                    )
                  }
                }

                // Fallback to Shopify billingAddress if custom attributes are not set or not matching "Da"
                if (order.billingAddress) {
                  return (
                    <>
                      {order.billingAddress.company && (
                      <p className="font-semibold text-[var(--foreground)]">{order.billingAddress.company}</p>
                      )}
                      <p>
                        {order.billingAddress.firstName}{' '}
                        {order.billingAddress.lastName}
                      </p>
                      <p>{order.billingAddress.address1}</p>
                      {order.billingAddress.address2 && (
                        <p>{order.billingAddress.address2}</p>
                      )}
                      <p>
                        {order.billingAddress.city}, {order.billingAddress.province}{' '}
                        {order.billingAddress.zip}
                      </p>
                      <p>{order.billingAddress.country}</p>
                    </>
                  )
                }

                return (
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    Nu au fost furnizate detalii de facturare.
                  </p>
                )
              })()}
              {order.invoicePdfUrl && (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <a
                    href={order.invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-neutral-800"
                  >
                    Descarcă factură ({order.invoiceNumber || 'PDF'})
                  </a>
                </div>
              )}
            </div>
        </section>

        <section className={detailSectionClass}>
          <h2 className={detailLabelClass}>
              Status Comandă
          </h2>
          <div className="space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
            <p>
              <span className="font-medium text-[var(--foreground)]">Plată:</span>{' '}
              <span className={`font-semibold ${financialStatusClass}`}>{financialStatusText}</span>
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Livrare:</span>{' '}
              <span className={`font-semibold ${fulfillmentStatusClass}`}>{fulfillmentStatusText}</span>
            </p>
            {order.fulfillment && (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="mb-1 font-semibold text-[var(--foreground)]">Informații expediere:</p>
                <p>
                  <span className="text-muted-foreground">Curier:</span>{' '}
                  {order.fulfillment.trackingCompany}
                </p>
                {order.fulfillment.trackingInfo && (
                  <p>
                    <span className="text-muted-foreground">AWB:</span>{' '}
                    <a
                      href={order.fulfillment.trackingInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      {order.fulfillment.trackingInfo.number}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="md:border md:bg-white md:p-6">
        <h2 className="mb-4 text-lg font-light uppercase tracking-[0.08em] text-[var(--foreground)] md:text-xl">
          Articole în această comandă
        </h2>
        <div className="divide-y divide-[var(--border)]">
          {order.lineItems.nodes.map((item) => {
            const imageUrl =
              item.variant?.image?.url || item.product?.featuredImage?.url // Prioritize variant image, then product featuredImage
            const imageAlt =
              item.variant?.image?.altText ||
              item.product?.featuredImage?.altText ||
              item.title

            return (
              <div
                key={item.id}
                className="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    width={80}
                    height={80}
                    className="h-20 w-20 shrink-0 border border-[var(--border)] object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {item.variant && item.variant.product ? (
                    <Link
                      href={`/products/${item.variant.product.handle}`}
                      className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--foreground)]">{item.title}</p>
                  )}
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Cantitate: {item.quantity}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {(() => {
                      const unit = parseFloat(item.variant?.price || '0')
                      const total = unit * item.quantity
                      return formatMoney(total, order.totalPriceSet.shopMoney.currencyCode)
                    })()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 border-t border-[var(--border)] pt-5 text-sm leading-6 md:ml-auto md:max-w-xs">
          <div className="space-y-2">
          <p className="flex justify-between gap-4 text-[var(--muted-foreground)]">
            Subtotal:{' '}
            <span className="font-medium text-foreground">
              {formatMoney(order.subtotalPriceSet.shopMoney.amount, order.subtotalPriceSet.shopMoney.currencyCode)}
            </span>
          </p>
          <p className="flex justify-between gap-4 text-[var(--muted-foreground)]">
            Livrare:{' '}
            <span className="font-medium text-foreground">
              {formatMoney(order.totalShippingPriceSet.shopMoney.amount, order.totalShippingPriceSet.shopMoney.currencyCode)}
            </span>
          </p>
          <p className="flex justify-between gap-4 text-[var(--muted-foreground)]">
            Taxe:{' '}
            <span className="font-medium text-foreground">
              {formatMoney(order.totalTaxSet.shopMoney.amount, order.totalTaxSet.shopMoney.currencyCode)}
            </span>
          </p>
          <p className="flex justify-between gap-4 border-t border-[var(--border)] pt-3 text-base font-semibold text-foreground">
            Total:{' '}
            <span className="font-bold">
              {formatMoney(order.totalPriceSet.shopMoney.amount, order.totalPriceSet.shopMoney.currencyCode)}
            </span>
          </p>
          </div>
        </div>
      </section>
    </div>
  )
}
