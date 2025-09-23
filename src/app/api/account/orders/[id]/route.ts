import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createStorefrontApiClient } from '@shopify/storefront-api-client'
import { GET_ORDER_DETAILS_QUERY } from '@/lib/queries'
import { Order } from '@/lib/shopify/generated/graphql'

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value

    if (!accessToken) {
      return Response.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2024-10'
    const publicAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

    if (!storeDomain || !publicAccessToken) {
      throw new Error('Missing Shopify environment variables')
    }

    const client = createStorefrontApiClient({
      storeDomain,
      apiVersion,
      publicAccessToken,
      privateAccessToken: accessToken,
    })

    const pathname = req.nextUrl.pathname
    const id = pathname.split('/').pop()
    const orderId = `gid://shopify/Order/${id}`

    const response = await client.request(
      GET_ORDER_DETAILS_QUERY,
      {
        variables: { orderId },
      }
    );

    if (!response.data || !response.data.node) {
      return Response.json(
        { error: { message: 'Order not found or invalid response' } },
        { status: 404 }
      );
    }

    const order: Order = response.data.node as Order;

    if (!order) {
      return Response.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      )
    }

    return Response.json({ order })
  } catch (error: unknown) {
    return Response.json(
      {
        error: {
          message: (error as Error).message || 'Failed to fetch order',
        },
      },
      { status: 500 }
    )
  }
}
