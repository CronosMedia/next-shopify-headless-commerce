import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { shopifyAdminRequest } from '@/lib/shopify/admin.server'

export const fetchCache = 'force-no-store'

const GET_ORDERS_ADMIN_QUERY = `#graphql
  query GetAdminOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customAttributes {
            key
            value
          }
          customer {
            firstName
            lastName
            email
          }
          invoicePdfUrl: metafield(namespace: "custom", key: "invoice_pdf_url") {
            value
          }
          invoiceNumber: metafield(namespace: "custom", key: "invoice_number") {
            value
          }
          invoiceSeries: metafield(namespace: "custom", key: "invoice_series") {
            value
          }
          invoiceProvider: metafield(namespace: "custom", key: "invoice_provider") {
            value
          }
          invoiceStatus: metafield(namespace: "custom", key: "invoice_status") {
            value
          }
          awbCode: metafield(namespace: "custom", key: "awb_code") {
            value
          }
          awbProvider: metafield(namespace: "custom", key: "awb_provider") {
            value
          }
          awbStatus: metafield(namespace: "custom", key: "awb_status") {
            value
          }
          courierName: metafield(namespace: "custom", key: "courier_name") {
            value
          }
          awbTrackingUrl: metafield(namespace: "custom", key: "awb_tracking_url") {
            value
          }
        }
      }
    }
  }
`

type AdminOrderNode = {
  id: string
  name: string
  createdAt: string
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  totalPriceSet: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  customAttributes: Array<{ key: string; value: string }>
  customer: {
    firstName: string
    lastName: string
    email: string
  } | null
  invoicePdfUrl: { value: string } | null
  invoiceNumber: { value: string } | null
  invoiceSeries: { value: string } | null
  invoiceProvider: { value: string } | null
  invoiceStatus: { value: string } | null
  awbCode: { value: string } | null
  awbProvider: { value: string } | null
  awbStatus: { value: string } | null
  courierName: { value: string } | null
  awbTrackingUrl: { value: string } | null
}

type ShopifyAdminOrdersResponse = {
  orders: {
    edges: Array<{
      node: AdminOrderNode
    }>
  }
}

export async function GET() {
  try {
    const adminSession = await requireAdminSession()

    if (!adminSession.authenticated) {
      return adminSession.response
    }

    // Call Shopify Admin API
    const response = await shopifyAdminRequest<ShopifyAdminOrdersResponse>(
      GET_ORDERS_ADMIN_QUERY,
      { first: 50 }
    )

    if (response.errors?.length) {
      return NextResponse.json(
        { error: response.errors[0].message },
        { status: 400 }
      )
    }

    const orders = response.data?.orders.edges.map(({ node }) => {
      return {
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        financialStatus: node.displayFinancialStatus,
        fulfillmentStatus: node.displayFulfillmentStatus,
        total: {
          amount: node.totalPriceSet.shopMoney.amount,
          currency: node.totalPriceSet.shopMoney.currencyCode,
        },
        customAttributes: node.customAttributes,
        customer: node.customer ? {
          name: `${node.customer.firstName || ''} ${node.customer.lastName || ''}`.trim() || 'Client Anonim',
          email: node.customer.email,
        } : {
          name: 'Client Anonim',
          email: '',
        },
        invoice: node.invoicePdfUrl?.value || node.invoiceNumber?.value ? {
          url: node.invoicePdfUrl?.value || '',
          number: node.invoiceNumber?.value || 'N/A',
          series: node.invoiceSeries?.value || 'DEMO',
          provider: node.invoiceProvider?.value || 'demo',
          status: node.invoiceStatus?.value || 'simulated',
        } : null,
        awb: node.awbCode?.value ? {
          code: node.awbCode.value,
          courier: node.courierName?.value || 'Sameday',
          provider: node.awbProvider?.value || 'demo',
          status: node.awbStatus?.value || 'simulated',
          trackingUrl: node.awbTrackingUrl?.value || '',
        } : null,
      }
    }) || []

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json(
      { error: 'Eroare la preluarea comenzilor.' },
      { status: 500 }
    )
  }
}
