import { shopifyClient } from './shopify'
import type { CartBuyerIdentityInput } from './types'

const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              sku
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              product {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
    buyerIdentity {
      customer {
        id
      }
    }
    deliveryGroups(first: 1) {
      edges {
        node {
          deliveryAddress {
            address1
            address2
            city
            company
            country
            firstName
            lastName
            phone
            province
            zip
          }
          deliveryOptions {
            handle
            title
            estimatedCost {
              amount
              currencyCode
            }
          }
          selectedDeliveryOption {
            handle
            title
            estimatedCost {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

const USER_ERROR_FRAGMENT = `#graphql
  fragment UserErrorFragment on CartUserError {
    code
    field
    message
  }
`

const CART_QUERY = `#graphql
  ${CART_FRAGMENT}
  query Cart($id: ID!) { cart(id: $id) { ...CartFields } }
`

const CART_CREATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

export type CartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    sku?: string
    image?: {
      url: string
      altText: string
      width: number
      height: number
    }
    price: { amount: string; currencyCode: string }
    selectedOptions?: {
      name: string
      value: string
    }[]
    product: {
      id: string // Add this property
      title: string
      handle: string
      featuredImage: {
        url: string
        altText: string
        width: number
        height: number
      }
    }
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: { amount: string; currencyCode: string }
    subtotalAmount: { amount: string; currencyCode: string }
  }
  lines: {
    edges: {
      node: CartLine
    }[]
  }
  buyerIdentity: {
    customer: { id: string } | null
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

// The robust wrapper to handle ALL Shopify API requests and errors
async function shopifyRequest(query: string, variables: Record<string, unknown>) {
  try {
    const { data, errors }: { data: Record<string, any>, errors?: any } = await shopifyClient.request(query, variables);

    if (errors) {
      const message = Array.isArray(errors)
        ? errors.map((e: any) => e.message).join(', ')
        : (errors as any).message || 'An unknown GraphQL error occurred.';
      if (errors.graphQLErrors && Array.isArray(errors.graphQLErrors)) {
        const graphQLErrorsMessages = errors.graphQLErrors.map((e: any) => e.message).join(', ');
        throw new Error(`GraphQL Client: ${graphQLErrorsMessages}. Original error: ${message}`);
      }
      throw new Error(`GraphQL Client: ${message}`);
    }

    if (!data) {
      throw new Error('No data returned from Shopify API');
    }

    const dataKey = Object.keys(data)[0];
    if (!dataKey) {
      throw new Error('No data key found in Shopify API response');
    }
    const result = data[dataKey];

    if (result && result.userErrors && result.userErrors.length > 0) {
      const errorMessages = result.userErrors.map((e: any) => e.message).join(', ');
      throw new Error(errorMessages);
    }

    return result;
  } catch (error: any) {
    // Check for GraphQL errors from the storefront-api-client
    if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
      const errorMessages = error.graphQLErrors.map((e: any) => e.message).join(', ');
      throw new Error(`GraphQL Client: ${errorMessages}`);
    }
    // Fallback to network errors (if any)
    if (error.networkError?.result?.errors) {
      const errors = error.networkError.result.errors;
      const errorMessages = Array.isArray(errors)
        ? errors.map((e: any) => e.message).join(', ')
        : (errors as any).message || 'An unknown network error occurred.';
      throw new Error(`Network Error: ${errorMessages}`);
    }
    // Re-throw if it's another type of error
    throw error;
  }
}

export async function cartGet(cartId: string): Promise<Cart> {
  const result = await shopifyRequest(CART_QUERY, { id: cartId });
  if (!result) {
    throw new Error('Cart not found');
  }
  return result;
}

export async function cartCreate(lines: { merchandiseId: string; quantity: number }[] = []): Promise<Cart> {
  const result = await shopifyRequest(CART_CREATE_MUTATION, { input: { lines } });
  if (!result || !result.cart) {
    throw new Error('Cart creation failed - no cart returned from Shopify');
  }
  return result.cart;
}

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const result = await shopifyRequest(CART_LINES_ADD_MUTATION, { cartId, lines });
  if (!result || !result.cart) {
    throw new Error('Failed to add lines to cart');
  }
  return result.cart;
}

export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<Cart> {
  const result = await shopifyRequest(CART_LINES_UPDATE_MUTATION, { cartId, lines });
  if (!result || !result.cart) {
    throw new Error('Failed to update cart lines');
  }
  return result.cart;
}

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<Cart> {
  const result = await shopifyRequest(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });
  if (!result || !result.cart) {
    throw new Error('Failed to remove cart lines');
  }
  return result.cart;
}

export async function cartBuyerIdentityUpdate(
  cartId: string,
  buyerIdentity: CartBuyerIdentityInput
): Promise<Cart> {
  const result = await shopifyRequest(CART_BUYER_IDENTITY_UPDATE_MUTATION, { cartId, buyerIdentity });
  if (!result || !result.cart) {
    throw new Error('Failed to update buyer identity');
  }
  return result.cart;
}