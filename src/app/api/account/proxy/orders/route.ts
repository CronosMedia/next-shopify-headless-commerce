import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const GET = async () => {
  try {
    // 1. Get the customer's Shopify ID from the cookie
    const cookieStore = await cookies()
    const customerIdGid = cookieStore.get('customer-shopify-id')?.value

    if (!customerIdGid) {
      return NextResponse.json(
        { error: 'Not authenticated. Customer ID missing.' },
        { status: 401 }
      )
    }

    // 2. Get Shopify credentials from environment variables
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
    const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-07'

    if (!storeDomain || !adminApiToken) {
      throw new Error('Missing Shopify Admin API environment variables')
    }

    // 3. Extract the numeric ID from the GID
    const numericCustomerId = customerIdGid.split('/').pop()
    if (!numericCustomerId) {
      throw new Error('Invalid customer ID format')
    }

    // 4. Construct the Admin API URL
    const adminApiUrl = `https://${storeDomain}/admin/api/${apiVersion}/customers/${numericCustomerId}/orders.json`

    // 5. Fetch the orders from the Admin API
    const shopifyResponse = await fetch(adminApiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    })

    if (!shopifyResponse.ok) {
      const errorBody = await shopifyResponse.json()
      console.error('Shopify Admin API Error:', errorBody)
      throw new Error(
        `Failed to fetch orders from Shopify: ${shopifyResponse.statusText}`
      )
    }

    const data = await shopifyResponse.json()

    // 6. Return the data to the client
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Proxy route error:', error)
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch orders' } },
      { status: 500 }
    )
  }
}
