'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

// Type updated to use product featuredImage
type AdminOrder = {
  id: string
  name: string
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
        const response = await fetch(`/api/account/proxy/orders/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error?.message || 'Failed to fetch order details.'
          )
        }

        setOrder(data.order)
      } catch (err: unknown) {
        setError(err.message)
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
        <p className="text-muted-foreground">Loading order details...</p>
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
          href="/account"
          className="mt-4 inline-block text-primary hover:underline"
        >
          &larr; Back to My Account
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link
          href="/account"
          className="mt-4 inline-block text-primary hover:underline"
        >
          &larr; Back to My Account
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/account"
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft size={16} />
        Back to My Account
      </Link>

      <div className="bg-background rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-muted pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Order {order.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Placed on {new Date(order.processedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {cancellationState === 'idle' && (
              <button
                onClick={handleRequestCancellation}
                className="bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                Request Cancellation
              </button>
            )}
            {/* ... other cancellation states */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Shipping Address
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
                No shipping address provided.
              </p>
            )}
          </div>
          <div className="text-left md:text-right">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Order Status
            </h2>
            <p className="text-sm">
              <span className="font-medium">Payment:</span>{' '}
              <span
                className={`font-semibold ${
                  order.displayFinancialStatus === 'PAID'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              >
                {order.displayFinancialStatus}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Fulfillment:</span>{' '}
              <span
                className={`font-semibold ${
                  order.displayFulfillmentStatus === 'FULFILLED'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              >
                {order.displayFulfillmentStatus}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Items in this Order
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
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {(() => {
                      const unit = parseFloat(item.variant?.price || '0')
                      const total = unit * item.quantity
                      const currency =
                        order.totalPriceSet.shopMoney.currencyCode
                      return `${total} ${currency}`
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
              {order.subtotalPriceSet.shopMoney.amount}{' '}
              {order.subtotalPriceSet.shopMoney.currencyCode}
            </span>
          </p>
          <p className="text-muted-foreground">
            Shipping:{' '}
            <span className="font-medium text-foreground">
              {order.totalShippingPriceSet.shopMoney.amount}{' '}
              {order.totalShippingPriceSet.shopMoney.currencyCode}
            </span>
          </p>
          <p className="text-muted-foreground">
            Taxes:{' '}
            <span className="font-medium text-foreground">
              {order.totalTaxSet.shopMoney.amount}{' '}
              {order.totalTaxSet.shopMoney.currencyCode}
            </span>
          </p>
          <p className="text-lg font-bold text-foreground">
            Total:{' '}
            <span className="font-bold">
              {order.totalPriceSet.shopMoney.amount}{' '}
              {order.totalPriceSet.shopMoney.currencyCode}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
