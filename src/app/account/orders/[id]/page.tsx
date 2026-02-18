'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

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
  } | null
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
  const { user } = useAuth()

  useEffect(() => {
    if (!id) return

    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const searchParams = window.location.search;
        const response = await fetch(`/api/account/proxy/orders/${id}${searchParams}`)
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
    if (!order || !user) return

    setCancellationState('sending')
    try {
      const response = await fetch('/api/orders/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderName: order.name,
          customerEmail: user.email,
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
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Se încarcă detaliile comenzii...</p>
      </div>
    )
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

  const formattedDate = new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(order.processedAt));
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);


  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/account?tab=orders"
        className="flex items-center font-barlow no-underline hover:underline uppercase mb-6"
        style={{
          fontFamily: 'Barlow, Arial, Helvetica, sans-serif',
          fontWeight: 600,
          color: 'rgb(51, 51, 51)',
          fontSize: '15px',
          lineHeight: '15px'
        }}
      >
        <ChevronLeft size={20} className="mr-1" />
        Înapoi la Istoric Comenzi
      </Link>

      <div className="bg-card p-6 border border-gray-300 rounded-none mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-muted pb-4 mb-4">
          <div className="flex items-center flex-grow">
            <div className="font-barlow text-2xl text-gray-800" style={{ color: 'rgb(51, 51, 51)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '24px', lineHeight: '28px', fontWeight: 400 }}>
              {capitalizedDate}
            </div>
            <div className="border-l border-gray-300 h-12 mx-4"></div>
            <div className="flex-grow">
              <p className="font-barlow" style={{ color: 'rgb(112, 112, 112)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '20px', fontWeight: 400 }}>
                Comanda nr:{' '}
                <span style={{ fontWeight: 600 }}>{order.name}</span>
              </p>
              <p className="font-barlow" style={{ color: 'rgb(112, 112, 112)', fontFamily: 'Barlow, Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '20px', fontWeight: 400 }}>
                Total:{' '}
                <span style={{ fontWeight: 600 }}>
                  {order.totalPriceSet.shopMoney.amount} LEI
                </span>
              </p>
            </div>
            <div className="flex justify-end">
              <div className="mt-4 md:mt-0">
                {/* 1. Check for "Cancellation Rejected" tag first */}
                {order.tags.includes('Cancellation Rejected') ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Cerere respinsă
                  </span>
                ) :
                  /* 2. Check for "Cancellation Requested" tag */
                  order.tags.includes('Cancellation Requested') ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Cerere trimisă
                    </span>
                  ) :
                    /* 3. Show button if no relevant tags and not currently sending */
                    cancellationState === 'idle' ? (
                      <button
                        onClick={handleRequestCancellation}
                        className="bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        Cerere de anulare
                      </button>
                    ) : cancellationState === 'sending' ? (
                      <p className="text-sm text-muted-foreground">Se trimite cererea...</p>
                    ) : cancellationState === 'sent' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Cerere trimisă
                      </span>
                    ) : cancellationState === 'error' ? (
                      <p className="text-sm text-red-600">Eroare la trimiterea cererii.</p>
                    ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Adresa de livrare
            </h2>
            {order.shippingAddress ? (
              <div className="text-muted-foreground text-sm">
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
              <p className="text-muted-foreground text-sm">
                Nu a fost furnizată nicio adresă de expediere.
              </p>
            )}
          </div>
          <div className="text-left md:text-right">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Status Comandă
            </h2>
            <p className="text-sm">
              <span className="font-medium">Plată:</span>{' '}
              <span
                className={`font-semibold ${order.displayFinancialStatus === 'PAID'
                  ? 'text-green-600'
                  : 'text-yellow-600'
                  }`}
              >
                {(() => {
                  const s = order.displayFinancialStatus;
                  if (s === 'PAID') return 'Plătită';
                  if (s === 'PENDING') return 'În așteptare';
                  if (s === 'REFUNDED') return 'Rambursată';
                  if (s === 'VOIDED') return 'Anulată';
                  return s;
                })()}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Livrare:</span>{' '}
              <span
                className={`font-semibold ${order.displayFulfillmentStatus === 'FULFILLED'
                  ? 'text-green-600'
                  : order.displayFulfillmentStatus === 'IN_PROGRESS'
                    ? 'text-blue-600'
                    : 'text-yellow-600'
                  }`}
              >
                {(() => {
                  const s = order.displayFulfillmentStatus;
                  if (s === 'FULFILLED') return 'Expediată';
                  if (s === 'UNFULFILLED') return 'Neexpediată';
                  if (s === 'IN_PROGRESS') return 'În procesare';
                  if (s === 'ON_HOLD') return 'În așteptare';
                  if (s === 'OPEN') return 'Deschisă';
                  if (s === 'PARTIALLY_FULFILLED') return 'Parțial expediată';
                  return s;
                })()}
              </span>
            </p>
            {order.fulfillment && (
              <div className="mt-4 pt-4 border-t border-muted">
                <p className="text-sm font-semibold mb-1">Informații expediere:</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Curier:</span>{' '}
                  {order.fulfillment.trackingCompany}
                </p>
                {order.fulfillment.trackingInfo && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">AWB:</span>{' '}
                    <a
                      href={order.fulfillment.trackingInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {order.fulfillment.trackingInfo.number}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 border border-gray-300 rounded-none">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Articole în această comandă
        </h2>
        <div className="space-y-4">
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
                className="flex items-center gap-4 border-b border-muted pb-4 last:border-b-0 last:pb-0"
              >
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    width={80}
                    height={80}
                    className="rounded-lg border border-muted"
                  />
                )}
                <div className="flex-grow">
                  {item.variant && item.variant.product ? (
                    <Link
                      href={`/products/${item.variant.product.handle}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="font-medium text-foreground">{item.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Cantitate: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {(() => {
                      const unit = parseFloat(item.variant?.price || '0')
                      const total = unit * item.quantity
                      return `${total.toFixed(2)} LEI`
                    })()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-muted text-right space-y-2">
          <p className="text-muted-foreground">
            Subtotal:{' '}
            <span className="font-medium text-foreground">
              {order.subtotalPriceSet.shopMoney.amount} LEI
            </span>
          </p>
          <p className="text-muted-foreground">
            Livrare:{' '}
            <span className="font-medium text-foreground">
              {order.totalShippingPriceSet.shopMoney.amount} LEI
            </span>
          </p>
          <p className="text-muted-foreground">
            Taxe:{' '}
            <span className="font-medium text-foreground">
              {order.totalTaxSet.shopMoney.amount} LEI
            </span>
          </p>
          <p className="text-lg font-bold text-foreground">
            Total:{' '}
            <span className="font-bold">
              {order.totalPriceSet.shopMoney.amount} LEI
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
