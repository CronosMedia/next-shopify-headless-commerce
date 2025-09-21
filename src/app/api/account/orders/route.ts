import { NextRequest } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { GET_CUSTOMER_ORDERS_QUERY } from '@/lib/queries'
import { Customer } from '@/lib/shopify/generated/graphql'

export const GET = async (req: NextRequest) => {
  try {
    const accessToken = req.cookies.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { customer } = await shopifyClient.request<{ customer: Customer }>(
      GET_CUSTOMER_ORDERS_QUERY,
      {
        customerAccessToken: accessToken,
      }
    )

    if (!customer) {
      return Response.json({ orders: [] })
    }

    return Response.json({
      orders: customer.orders.edges.map((edge) => edge.node),
    })
  } catch (error: unknown) {
    return Response.json(
      {
        error: {
          message: (error as Error).message || 'Failed to fetch orders',
        },
      },
      { status: 500 }
    )
  }
}
