import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Corrected GraphQL query for the Admin API
const GET_ORDER_DETAILS_ADMIN_QUERY = `
  query getOrderDetails($id: ID!) {
    order(id: $id) {
      id
      name # e.g., #1001
      legacyResourceId # The order number
      processedAt
      displayFinancialStatus
      displayFulfillmentStatus
      shippingAddress {
        firstName
        lastName
        address1
        address2
        city
        province
        zip
        country
      }
      customer {
        id
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 50) {
        nodes {
          id
          title
          quantity
          variant {
            price
            image {
              url
              altText
              width
              height
            }
            product {
              handle
            }
          }
          product {
            featuredImage {
              url
              altText
              width
              height
            }
          }
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const customerIdGid = cookieStore.get('customer-shopify-id')?.value

    if (!customerIdGid) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
    const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-07'

    if (!storeDomain || !adminApiToken) {
      throw new Error('Missing Shopify Admin API environment variables')
    }

    const numericOrderId = req.nextUrl.pathname.split('/').pop()
    if (!numericOrderId) {
      throw new Error('Order ID is missing from the URL')
    }
    const orderGid = `gid://shopify/Order/${numericOrderId}`

    const adminApiUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`

    const shopifyResponse = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ORDER_DETAILS_ADMIN_QUERY,
        variables: { id: orderGid },
      }),
    })

    if (!shopifyResponse.ok) {
      const errorBody = await shopifyResponse.json()
      throw new Error(
        `Failed to fetch from Shopify: ${JSON.stringify(errorBody.errors)}`
      )
    }

    const { data, errors } = await shopifyResponse.json()

    if (errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(errors)}`)
    }

    const order = data.order

    // Security Check: Ensure the requested order belongs to the logged-in customer
    if (!order || order.customer.id !== customerIdGid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error: unknown) {
    console.error('Proxy route error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order details';
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 500 }
    )
  }
}
