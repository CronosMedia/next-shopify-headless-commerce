import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'
import {GET_ORDER_DETAILS_QUERY} from '@/lib/queries'
import {shopifyClient} from '@/lib/shopify'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {serverLogger} from '@/lib/logger.server'
import {getAdminSession, isValidAdminSession} from '@/lib/admin-session'

export const fetchCache = 'force-no-store'

type Money = {
  amount: string
  currencyCode: string
}

type TrackingInfo = {
  company?: string | null
  number: string
  url: string
}

type OrderLine = {
  id?: string
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

type AdminOrderLineItemNode = {
  id: string
  title: string
  quantity: number
  variant: {
    price: string
  } | null
  taxLines: Array<{
    rate: number
  }>
}

type AdminOrderDetails = {
  id: string
  name: string
  processedAt: string
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  totalPriceSet: {shopMoney: Money}
  subtotalPriceSet: {shopMoney: Money}
  totalTaxSet: {shopMoney: Money}
  totalShippingPriceSet: {shopMoney: Money}
  customAttributes: Array<{key: string; value: string}>
  successfulFulfillments: Array<{
    trackingInfo: TrackingInfo[]
  }>
  lineItems: {
    edges: Array<{
      node: AdminOrderLineItemNode
    }>
  }
  billingAddress: StorefrontOrder['billingAddress']
  shippingAddress: StorefrontOrder['shippingAddress']
}

type AdminOrderDetailsData = {
  order: AdminOrderDetails | null
}

type OrderAdminInfoData = {
  order: {
    tags: string[]
    invoicePdfUrl: {value: string} | null
    invoiceNumber: {value: string} | null
    awbCode: {value: string} | null
    courierName: {value: string} | null
  } | null
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
  billingAddress: Record<string, string | null> | null
  customAttributes: Array<{ key: string; value: string }>
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

function normalizeOrderId(orderId: string) {
  return orderId.split('?')[0]
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get(
      'customer-access-token'
    )?.value
    const adminSession = await getAdminSession()
    const hasAdminSession = isValidAdminSession(adminSession)

    if (!customerAccessToken && !hasAdminSession) {
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
    let storefrontOrder: StorefrontOrder | null = null

    if (customerAccessToken) {
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

      storefrontOrder = response.data.customer?.orders.edges
        .map(({node}) => node)
        .find(
          ({id}) =>
            normalizeOrderId(id) === normalizeOrderId(requestedOrderId)
        ) ?? null
    } else if (hasAdminSession) {
      const adminOrderQuery = `#graphql
        query GetOrderDetailsAdmin($id: ID!) {
          order(id: $id) {
            id
            name
            processedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalTaxSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            customAttributes { key value }
            successfulFulfillments: fulfillments(first: 5) {
              trackingInfo {
                company
                number
                url
              }
            }
            lineItems(first: 100) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    price
                  }
                  taxLines {
                    rate
                  }
                }
              }
            }
            billingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            shippingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              province
              zip
              country
              phone
            }
          }
        }
      `
      const adminResponse = await shopifyAdminRequest<AdminOrderDetailsData>(
        adminOrderQuery,
        {id: requestedOrderId}
      )
      if (adminResponse.errors?.length) {
        return NextResponse.json(
          {error: {message: adminResponse.errors[0].message}},
          {status: 400}
        )
      }
      
      const adminOrder = adminResponse.data?.order
      if (adminOrder) {
        // Map lineItems shape from connections edges to nodes array expected by storefront mapping
        const storefrontLineItems = {
          edges: adminOrder.lineItems.edges.map((edge) => ({
            node: {
              ...edge.node,
              variant: edge.node.variant
                ? {
                    price: {
                      amount: edge.node.variant.price,
                      currencyCode: adminOrder.totalPriceSet.shopMoney.currencyCode,
                    },
                    image: null,
                    product: {
                      handle: '',
                    },
                  }
                : null,
              discountedTotalPrice: {
                amount: edge.node.variant?.price || '0',
                currencyCode: adminOrder.totalPriceSet.shopMoney.currencyCode,
              },
            },
          })),
        }

        storefrontOrder = {
          id: adminOrder.id,
          name: adminOrder.name,
          orderNumber: Number(orderIdNumeric),
          processedAt: adminOrder.processedAt,
          financialStatus: adminOrder.displayFinancialStatus,
          fulfillmentStatus: adminOrder.displayFulfillmentStatus,
          totalPrice: adminOrder.totalPriceSet.shopMoney,
          subtotalPrice: adminOrder.subtotalPriceSet.shopMoney,
          totalShippingPrice: adminOrder.totalShippingPriceSet.shopMoney,
          totalTax: adminOrder.totalTaxSet.shopMoney,
          shippingAddress: adminOrder.shippingAddress,
          billingAddress: adminOrder.billingAddress,
          customAttributes: adminOrder.customAttributes,
          successfulFulfillments: (adminOrder.successfulFulfillments || []).map(
            (fulfillment) => {
              const firstTracking = fulfillment.trackingInfo[0]

              return {
                trackingCompany: firstTracking?.company || 'Curier',
                trackingInfo: fulfillment.trackingInfo,
              }
            }
          ),
          lineItems: storefrontLineItems,
        }
      }
    }

    if (!storefrontOrder) {
      return NextResponse.json(
        {error: {message: 'Order not found or forbidden.'}},
        {status: 404}
      )
    }

    let orderTags: string[] = []
    let invoicePdfUrl: string | null = null
    let invoiceNumber: string | null = null
    let awbCode: string | null = null
    let courierName: string | null = null

    try {
      const adminInfoResponse = await shopifyAdminRequest<OrderAdminInfoData>(
        `#graphql
          query OrderAdminInfo($id: ID!) {
            order(id: $id) {
              tags
              invoicePdfUrl: metafield(namespace: "custom", key: "invoice_pdf_url") {
                value
              }
              invoiceNumber: metafield(namespace: "custom", key: "invoice_number") {
                value
              }
              awbCode: metafield(namespace: "custom", key: "awb_code") {
                value
              }
              courierName: metafield(namespace: "custom", key: "courier_name") {
                value
              }
            }
          }
        `,
        {id: normalizeOrderId(storefrontOrder.id)}
      )
      const adminOrder = adminInfoResponse.data?.order
      orderTags = adminOrder?.tags ?? []
      invoicePdfUrl = adminOrder?.invoicePdfUrl?.value ?? null
      invoiceNumber = adminOrder?.invoiceNumber?.value ?? null
      awbCode = adminOrder?.awbCode?.value ?? null
      courierName = adminOrder?.courierName?.value ?? null
    } catch (error: unknown) {
      serverLogger.warn('account.order.adminInfo.failed', error)
    }

    const firstFulfillment = storefrontOrder.successfulFulfillments[0]
    const firstTrackingInfo = firstFulfillment?.trackingInfo[0]

    const mappedOrder = {
      ...storefrontOrder,
      tags: orderTags,
      invoicePdfUrl,
      invoiceNumber,
      awbCode,
      courierName,
      displayFinancialStatus: storefrontOrder.financialStatus || 'UNKNOWN',
      displayFulfillmentStatus:
        storefrontOrder.fulfillmentStatus || 'UNFULFILLED',
      fulfillment: firstFulfillment
        ? {
            trackingCompany:
              firstFulfillment.trackingCompany ||
              firstTrackingInfo?.company ||
              courierName ||
              'Curier',
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
        nodes: storefrontOrder.lineItems.edges.map(({node}, index: number) => ({
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
