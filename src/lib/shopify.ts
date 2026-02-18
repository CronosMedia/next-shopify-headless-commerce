import { createStorefrontApiClient } from '@shopify/storefront-api-client'

const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const apiVersion =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION || '2024-10'

if (!storeDomain || !accessToken) {
  // Fail fast during build/runtime to surface missing configuration
  throw new Error(
    'Missing Shopify env vars: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN are required'
  )
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: {
    edges: Array<{
      node: {
        id: string
        quantity: number
        merchandise: {
          id: string
          title: string
          image?: {
            url: string
            altText?: string
            width?: number
            height?: number
          }
          price: {
            amount: string
            currencyCode: string
          }
          product: {
            title: string
            handle: string
          }
        }
      }
    }>
  }
  cost: {
    subtotalAmount: {
      amount: string
      currencyCode: string
    }
    totalAmount: {
      amount: string
      currencyCode: string
    }
  }
  deliveryGroups: {
    edges: Array<{
      node: {
        deliveryAddress?: {
          address1?: string
          address2?: string
          city?: string
          company?: string
          countryCode?: string
          firstName?: string
          lastName?: string
          phone?: string
          provinceCode?: string
          zip?: string
        }
        deliveryOptions: Array<{
          handle: string
          title: string
          estimatedCost: {
            amount: string
            currencyCode: string
          }
        }>
        selectedDeliveryOption?: {
          handle: string
          title: string
          estimatedCost: {
            amount: string
            currencyCode: string
          }
        }
      }
    }>
  }
}

export type ShopifyUserError = {
  code: string
  field: string[]
  message: string
}

export type CartCreateResponse = {
  cartCreate: {
    cart: Cart | null
    userErrors: Array<ShopifyUserError>
  }
}

export type CartResponse = {
  cart: Cart
}

export type CartMutationResponse = {
  cart: Cart
  userErrors: Array<{
    code: string
    field: string[]
    message: string
  }>
}

export type GraphQLResponse<T> = {
  data: {
    [K in keyof T]: T[K] extends { cart: Cart }
    ? { cart: T[K]['cart'] }
    : T[K] extends { [key: string]: unknown }
    ? T[K]
    : never
  }
  headers?: Headers
  errors?: any
}

const client = createStorefrontApiClient({ // Create client once
  storeDomain,
  apiVersion,
  publicAccessToken: accessToken,
});

export const shopifyClient = {
  ...client, // Spread the client properties
  request: async <T extends Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> => {
    const response = await client.request(query, { variables }); // Use the single client instance
    return response as GraphQLResponse<T>;
  },
};

/**
 * Helper for making authenticated requests to the Shopify Storefront API.
 * Uses raw fetch to support cache: 'no-store' for real-time data.
 */
export async function shopifyStorefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  customerAccessToken?: string
): Promise<GraphQLResponse<T>> {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION
  const publicToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN

  if (!storeDomain || !publicToken) {
    throw new Error('Missing Shopify Storefront API configuration')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': publicToken,
  }

  if (customerAccessToken) {
    headers['X-Shopify-Customer-Access-Token'] = customerAccessToken
  }

  const response = await fetch(
    `https://${storeDomain}/api/${apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      cache: 'no-store', // Disable caching
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Shopify Storefront API Error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

/**
 * Helper for making authenticated requests to the Shopify Admin API.
 * Only use this server-side.
 */
export async function shopifyAdminRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  const adminDomain = process.env.SHOPIFY_STORE_DOMAIN
  const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
  const adminVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  if (!adminDomain || !adminToken) {
    throw new Error('Missing Shopify Admin API configuration')
  }

  const response = await fetch(
    `https://${adminDomain}/admin/api/${adminVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Shopify Admin API Error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

export type ShopifyClient = typeof shopifyClient
