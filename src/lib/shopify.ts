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
          country?: string
          firstName?: string
          lastName?: string
          phone?: string
          province?: string
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

export const shopifyClient = {
  ...createStorefrontApiClient({
    storeDomain,
    apiVersion,
    publicAccessToken: accessToken,
  }),
  request: async <T extends Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> => {
    const client = createStorefrontApiClient({
      storeDomain,
      apiVersion,
      publicAccessToken: accessToken,
    })
    const response = await client.request(query, { variables })
    return response as GraphQLResponse<T>
  },
}

export type ShopifyClient = typeof shopifyClient
