import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { appendFileSync } from 'fs'

export const GET = async () => {
  try {
    // 1. Get the customer's Shopify Access Token from the cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated. Session missing.' },
        { status: 401 }
      )
    }

    // 2. Import client and query
    const { shopifyClient } = await import('@/lib/shopify')
    const { GET_CUSTOMER_ORDERS_QUERY } = await import('@/lib/queries')

    // 3. Fetch the orders from the Storefront API
    const response = (await shopifyClient.request(GET_CUSTOMER_ORDERS_QUERY, {
      customerAccessToken: accessToken,
    })) as any

    if (response.errors) {
      console.error('Storefront API Orders Error:', response.errors)
      return NextResponse.json(
        { error: { message: response.errors[0]?.message || 'Failed to fetch orders' } },
        { status: 400 }
      )
    }

    const customer = response.data?.customer
    const orders = customer?.orders?.edges?.map((edge: any) => edge.node) || []

    console.log(`Orders Proxy: Successfully fetched ${orders.length} orders via Storefront API`);

    // 4. Return the data to the client in the format AuthProvider expects
    return NextResponse.json({ orders })
  } catch (error: any) {
    const logMsg = `[${new Date().toISOString()}] Orders Proxy Error: ${error.message}\nStack: ${error.stack}\n`;
    try { appendFileSync('/tmp/orders-proxy.log', logMsg); } catch (e) { }
    console.error('Proxy route error:', error)
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch orders' } },
      { status: 500 }
    )
  }
}
