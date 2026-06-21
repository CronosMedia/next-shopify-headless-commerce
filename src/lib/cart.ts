import 'server-only'
import {shopifyClient, type ShopifyUserError} from './shopify'
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
          id
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

const CART_SELECTED_DELIVERY_OPTION_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation cartSelectedDeliveryOptionsUpdate($cartId: ID!, $selectedDeliveryOptions: [CartSelectedDeliveryOptionInput!]!) {
    cartSelectedDeliveryOptionsUpdate(cartId: $cartId, selectedDeliveryOptions: $selectedDeliveryOptions) {
      cart { ...CartFields }
      userErrors { ...UserErrorFragment }
    }
  }
`

const CART_ATTRIBUTES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  ${USER_ERROR_FRAGMENT}
  mutation CartAttributesUpdate($attributes: [AttributeInput!]!, $cartId: ID!) {
    cartAttributesUpdate(attributes: $attributes, cartId: $cartId) {
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
        id: string
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

type CartMutationResult = {
  cart: Cart | null
  userErrors: ShopifyUserError[]
}

function hasUserErrors(
  value: unknown
): value is {userErrors: ShopifyUserError[]} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userErrors' in value &&
    Array.isArray(value.userErrors)
  )
}

type ShopifyGraphQLError = { message?: string }
type ShopifyErrorObject = { graphQLErrors?: ShopifyGraphQLError[]; message?: string }

async function shopifyRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await shopifyClient.request<Record<string, T>>(query, variables)
  const {data, errors} = response || {}

  if (errors) {
    if (Array.isArray(errors)) {
      throw new Error(errors.map((e) => (typeof e === 'object' && e !== null && 'message' in e ? (e as Record<string, unknown>).message : String(e))).join(', '))
    } else if (typeof errors === 'object') {
      const errObj = errors as ShopifyErrorObject
      const graphQLErrors = errObj.graphQLErrors
      if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
        throw new Error(graphQLErrors.map((e) => e.message || String(e)).join(', '));
      }
      throw new Error(errObj.message || JSON.stringify(errors));
    } else {
      throw new Error(String(errors));
    }
  }

  if (!data) {
    throw new Error('No data returned from Shopify API')
  }

  const result = Object.values(data)[0]
  if (result === undefined) {
    throw new Error('No data returned from Shopify API')
  }

  if (hasUserErrors(result) && result.userErrors.length) {
    throw new Error(result.userErrors.map(({message}) => message).join(', '))
  }

  return result
}

export async function cartGet(cartId: string): Promise<Cart | null> {
  const result = await shopifyRequest<Cart>(CART_QUERY, { id: cartId });
  if (!result || !result.id) {
    return null;
  }
  return result;
}

export async function cartCreate(lines?: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
  const sanitizedLines = lines ? lines.map(line => ({
    merchandiseId: line.merchandiseId,
    quantity: line.quantity
  })) : []

  const result = await shopifyRequest<CartMutationResult>(
    CART_CREATE_MUTATION,
    { input: { lines: sanitizedLines } }
  )
  if (!result || !result.cart) {
    throw new Error('Cart creation failed - no cart returned from Shopify');
  }
  return result.cart;
}

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_LINES_ADD_MUTATION,
    {cartId, lines}
  )
  if (!result || !result.cart) {
    throw new Error('Failed to add lines to cart');
  }
  return result.cart;
}

export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_LINES_UPDATE_MUTATION,
    {cartId, lines}
  )
  if (!result || !result.cart) {
    throw new Error('Failed to update cart lines');
  }
  return result.cart;
}

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_LINES_REMOVE_MUTATION,
    {cartId, lineIds}
  )
  if (!result || !result.cart) {
    throw new Error('Failed to remove cart lines');
  }
  return result.cart;
}

export async function cartBuyerIdentityUpdate(
  cartId: string,
  buyerIdentity: CartBuyerIdentityInput
): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_BUYER_IDENTITY_UPDATE_MUTATION,
    {cartId, buyerIdentity}
  )
  if (!result || !result.cart) {
    throw new Error('Failed to update buyer identity');
  }
  return result.cart;
}

export async function cartSelectedDeliveryOptionUpdate(
  cartId: string,
  deliveryGroupId: string,
  selectedDeliveryOptionHandle: string
): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_SELECTED_DELIVERY_OPTION_UPDATE_MUTATION,
    {
      cartId,
      selectedDeliveryOptions: [
        {
          deliveryGroupId,
          deliveryOptionHandle: selectedDeliveryOptionHandle,
        },
      ],
    }
  )
  if (!result || !result.cart) {
    throw new Error('Failed to update selected delivery option');
  }
  return result.cart;
}

export async function cartAttributesUpdate(
  cartId: string,
  attributes: { key: string; value: string }[]
): Promise<Cart> {
  const result = await shopifyRequest<CartMutationResult>(
    CART_ATTRIBUTES_UPDATE_MUTATION,
    { cartId, attributes }
  )
  if (!result || !result.cart) {
    throw new Error('Failed to update cart attributes');
  }
  return result.cart;
}
