import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'
import {GET_ORDER_DETAILS_QUERY} from '@/lib/queries'
import {shopifyClient} from '@/lib/shopify'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {serverLogger} from '@/lib/logger.server'

export const fetchCache = 'force-no-store'

type Money = {
  amount: string
  currencyCode: string
}

type TrackingInfo = {
  number: string
  url: string
}

type OrderLine = {
  title: string
  quantity: number
  variant: {
    price: Money
    image: {
      url: string
      altText: string | null
      width: number
      height: number
    } | null
    product: {
      handle: string
    }
  } | null
  discountedTotalPrice: Money
}

type StorefrontOrder = {
  id: string
  name: string
  orderNumber: number
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  totalPrice: Money
  subtotalPrice: Money
  totalShippingPrice: Money
  totalTax: Money
  shippingAddress: Record<string, string | null> | null
  successfulFulfillments: Array<{
    trackingCompany: string
    trackingInfo: TrackingInfo[]
  }>
  lineItems: {
    edges: Array<{node: OrderLine}>
  }
}

type OrderDetailsData = {
  customer: {
    orders: {
      edges: Array<{node: StorefrontOrder}>
    }
  } | null
}

type OrderTagsData = {
  order: {
    tags: string[]
  } | null
}

function normalizeOrderId(orderId: string) {
  return orderId.split('?')[0]
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get(
      'customer-access-token'
    )?.value

    if (!customerAccessToken) {
      return NextResponse.json(
        {error: {message: 'Not authenticated.'}},
        {status: 401}
      )
    }

    const orderIdNumeric = req.nextUrl.pathname.split('/').pop()
    if (!orderIdNumeric) {
      return NextResponse.json(
        {error: {message: 'Order ID is missing.'}},
        {status: 400}
      )
    }

    const requestedOrderId = `gid://shopify/Order/${orderIdNumeric}`
    const response = await shopifyClient.request<OrderDetailsData>(
      GET_ORDER_DETAILS_QUERY,
      {customerAccessToken, first: 100}
    )

    if (response.errors?.length) {
      return NextResponse.json(
        {error: {message: response.errors[0].message}},
        {status: 400}
      )
    }

    const storefrontOrder = response.data.customer?.orders.edges
      .map(({node}) => node)
      .find(
        ({id}) =>
          normalizeOrderId(id) === normalizeOrderId(requestedOrderId)
      )

    if (!storefrontOrder) {
      return NextResponse.json(
        {error: {message: 'Order not found or forbidden.'}},
        {status: 404}
      )
    }

    let orderTags: string[] = []
    try {
      const tagsResponse = await shopifyAdminRequest<OrderTagsData>(
        `#graphql
          query OrderTags($id: ID!) {
            order(id: $id) {
              tags
            }
          }
        `,
        {id: normalizeOrderId(storefrontOrder.id)}
      )
      orderTags = tagsResponse.data?.order?.tags ?? []
    } catch (error: unknown) {
      serverLogger.warn('account.order.tags.failed', error)
    }

    const firstFulfillment = storefrontOrder.successfulFulfillments[0]
    const firstTrackingInfo = firstFulfillment?.trackingInfo[0]

    const mappedOrder = {
      ...storefrontOrder,
      tags: orderTags,
      displayFinancialStatus: storefrontOrder.financialStatus || 'UNKNOWN',
      displayFulfillmentStatus:
        storefrontOrder.fulfillmentStatus || 'UNFULFILLED',
      fulfillment: firstFulfillment
        ? {
            trackingCompany: firstFulfillment.trackingCompany,
            trackingInfo: firstTrackingInfo ?? null,
          }
        : null,
      subtotalPriceSet: {shopMoney: storefrontOrder.subtotalPrice},
      totalShippingPriceSet: {
        shopMoney: storefrontOrder.totalShippingPrice,
      },
      totalTaxSet: {shopMoney: storefrontOrder.totalTax},
      totalPriceSet: {shopMoney: storefrontOrder.totalPrice},
      legacyResourceId: orderIdNumeric,
      lineItems: {
        nodes: storefrontOrder.lineItems.edges.map(({node}, index) => ({
          id: `line-item-${index}`,
          ...node,
          variant: node.variant
            ? {
                ...node.variant,
                price: node.variant.price.amount,
              }
            : null,
        })),
      },
    }

    return NextResponse.json({order: mappedOrder})
  } catch (error: unknown) {
    serverLogger.error('account.order.details.failed', error)
    return NextResponse.json(
      {error: {message: 'Detaliile comenzii nu au putut fi încărcate.'}},
      {status: 500}
    )
  }
}
