import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { appendFileSync } from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'proxy-debug.log')

function debugLog(msg: string) {
  const timestamp = new Date().toISOString()
  try {
    appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`)
  } catch (e) {
    console.error('Failed to write to debug log:', e)
  }
}

// Force no caching for this route handler to ensure real-time status updates
export const fetchCache = 'force-no-store'

export const GET = async (req: NextRequest) => {
  try {
    debugLog(`GET ${req.nextUrl.pathname}`)

    // 1. Get the customer's Shopify Access Token from the cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value

    if (!accessToken) {
      debugLog('Error: No access token found in cookies')
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    // 2. Extract order ID from URL
    const orderIdNumeric = req.nextUrl.pathname.split('/').pop()
    if (!orderIdNumeric) {
      debugLog('Error: Order ID missing from URL')
      throw new Error('Order ID is missing from the URL')
    }
    const orderGid = `gid://shopify/Order/${orderIdNumeric}`
    debugLog(`Fetching order details for GID: ${orderGid}`)

    // 3. Import client and query
    const { shopifyClient } = await import('@/lib/shopify')
    const { GET_ORDER_DETAILS_QUERY } = await import('@/lib/queries')

    // 4. Fetch the order details from the Storefront API (Standard Client)
    // Caching is disabled via route config export above
    debugLog('Calling Shopify Storefront API (Fetch List)...')
    const response = (await shopifyClient.request(GET_ORDER_DETAILS_QUERY, {
      customerAccessToken: accessToken,
      first: 20, // Fetch the last 20 orders
    })) as any

    if (response.errors) {
      debugLog(`Shopify API Errors: ${JSON.stringify(response.errors)}`)
      console.error('Storefront API Order Detail Error:', response.errors)
      return NextResponse.json(
        { error: { message: response.errors[0]?.message || 'Failed to fetch order details' } },
        { status: 400 }
      )
    }

    debugLog(`Shopify Data: ${JSON.stringify(response.data)}`)
    const customer = response.data?.customer
    debugLog(`Customer: ${customer?.email} (ID: ${customer?.id})`)
    const orders = customer?.orders?.edges || []
    debugLog(`Orders found: ${orders.length}`)

    // Find the specific order in the list
    // Use startsWith because Storefront API IDs sometimes have ?key=... suffix
    const orderEdge = orders.find((edge: any) => edge.node.id.startsWith(orderGid))
    const storefrontOrder = orderEdge?.node

    if (!storefrontOrder) {
      debugLog(`Error: Order ${orderGid} not found in the fetched list of ${orders.length} orders`)
      // If not in the last 20, try to log what IDs we DO have
      const availableIds = orders.map((e: any) => e.node.id).join(', ')
      debugLog(`Available IDs: ${availableIds}`)
      return NextResponse.json({ error: 'Order not found or forbidden' }, { status: 404 })
    }

    // 5. Fetch Tags via Admin API (Hybrid Approach)
    // Storefront API doesn't expose tags, so we try Admin API.
    // If it fails (permissions), we default to empty tags to keep the page working.
    let orderTags: string[] = []
    try {
      const { shopifyAdminRequest } = await import('@/lib/shopify')
      const cleanId = storefrontOrder.id.split('?')[0]
      const TAGS_QUERY = `#graphql
         query getTags($id: ID!) {
           order(id: $id) {
             tags
           }
         }
       `
      const tagRes = await shopifyAdminRequest<any>(TAGS_QUERY, { id: cleanId })
      if (tagRes.data?.order?.tags) {
        orderTags = tagRes.data.order.tags
      }
    } catch (tagError) {
      console.warn('Failed to fetch tags via Admin API (ignoring):', tagError)
      // Proceed without tags
    }

    debugLog('Mapping storefront order to frontend format...')
    // 6. Build/Map the order object to match the "AdminOrder" format expected by the frontend
    try {
      const mappedOrder = {
        ...storefrontOrder,
        tags: orderTags,
        displayFinancialStatus: storefrontOrder.financialStatus || 'UNKNOWN',
        displayFulfillmentStatus: storefrontOrder.fulfillmentStatus || 'UNFULFILLED',
        // Map fulfillment tracking info
        fulfillment: storefrontOrder.successfulFulfillments && storefrontOrder.successfulFulfillments.length > 0
          ? {
            trackingCompany: storefrontOrder.successfulFulfillments[0].trackingCompany,
            trackingInfo: storefrontOrder.successfulFulfillments[0].trackingInfo && storefrontOrder.successfulFulfillments[0].trackingInfo.length > 0
              ? {
                number: storefrontOrder.successfulFulfillments[0].trackingInfo[0].number,
                url: storefrontOrder.successfulFulfillments[0].trackingInfo[0].url,
              }
              : null,
          }
          : null,
        // Map prices to the "...Set.shopMoney" structure expected by the frontend
        subtotalPriceSet: { shopMoney: storefrontOrder.subtotalPrice || { amount: '0', currencyCode: 'RON' } },
        totalShippingPriceSet: { shopMoney: storefrontOrder.totalShippingPrice || { amount: '0', currencyCode: 'RON' } },
        totalTaxSet: { shopMoney: storefrontOrder.totalTax || { amount: '0', currencyCode: 'RON' } },
        totalPriceSet: { shopMoney: storefrontOrder.totalPrice || { amount: '0', currencyCode: 'RON' } },
        // Add legacyResourceId placeholder if needed
        legacyResourceId: orderIdNumeric,
        // Flatten lineItems edges to nodes
        lineItems: {
          nodes: (storefrontOrder.lineItems?.edges || []).map((edge: any, index: number) => {
            const node = edge.node;
            return {
              id: node.id || `line-item-${index}`,
              ...node,
              variant: node.variant ? {
                ...node.variant,
                // Frontend expects variant.price as a string
                price: node.variant.price?.amount || '0'
              } : null
            };
          }),
        },
      }
      debugLog(`Successful Fulfillments: ${JSON.stringify(storefrontOrder.successfulFulfillments, null, 2)}`)
      debugLog('Successfully mapped order')
      return NextResponse.json({ order: mappedOrder })
    } catch (mapError: any) {
      debugLog(`Mapping Crash: ${mapError.message}\n${mapError.stack}`)
      throw mapError
    }
  } catch (error: any) {
    debugLog(`Proxy Catch Block: ${error.message}\n${error.stack}`)
    console.error('Proxy route [id] error:', error)
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch order details' } },
      { status: 500 }
    )
  }
}
