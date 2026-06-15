import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'
import {GET_CUSTOMER_ORDERS_QUERY} from '@/lib/queries'
import {shopifyClient} from '@/lib/shopify'
import {serverLogger} from '@/lib/logger.server'

export const fetchCache = 'force-no-store'

type CustomerOrder = {
  id: string
  orderNumber: number
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  totalPrice: {
    amount: string
    currencyCode: string
  }
}

type CustomerOrdersData = {
  customer: {
    orders: {
      edges: Array<{node: CustomerOrder}>
    }
  } | null
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get(
      'customer-access-token'
    )?.value

    if (!customerAccessToken) {
      return NextResponse.json(
        {error: {message: 'Not authenticated. Session missing.'}},
        {status: 401}
      )
    }

    const response = await shopifyClient.request<CustomerOrdersData>(
      GET_CUSTOMER_ORDERS_QUERY,
      {customerAccessToken, first: 100}
    )

    if (response.errors?.length) {
      return NextResponse.json(
        {error: {message: response.errors[0].message}},
        {status: 400}
      )
    }

    const orders =
      response.data.customer?.orders.edges.map(({node}) => node) ?? []

    return NextResponse.json({orders})
  } catch (error: unknown) {
    serverLogger.error('account.orders.list.failed', error)
    return NextResponse.json(
      {error: {message: 'Comenzile nu au putut fi încărcate.'}},
      {status: 500}
    )
  }
}
