import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
          awbCode: metafield(namespace: "custom", key: "awb_code") {
            value
          }
          courierName: metafield(namespace: "custom", key: "courier_name") {
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
  awbCode: { value: string } | null
  courierName: { value: string } | null
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
    // Authenticate admin session
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')?.value

    if (session !== 'true') {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      )
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
        invoice: node.invoicePdfUrl?.value ? {
          url: node.invoicePdfUrl.value,
          number: node.invoiceNumber?.value || 'N/A',
        } : null,
        awb: node.awbCode?.value ? {
          code: node.awbCode.value,
          courier: node.courierName?.value || 'Sameday',
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
