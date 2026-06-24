import {NextRequest} from 'next/server'
import {cookies} from 'next/headers'
import {shopifyClient} from '@/lib/shopify'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {serverLogger} from '@/lib/logger.server'

const WISHLIST_NAMESPACE = 'maison'
const WISHLIST_KEY = 'wishlist'
const WISHLIST_TYPE = 'json'
const WISHLIST_LIMIT = 100

type StorefrontCustomerResponse = {
  customer: {
    id: string
  } | null
}

type WishlistMetafieldResponse = {
  customer: {
    metafield: {
      value: string
    } | null
  } | null
}

type MetafieldsSetResponse = {
  metafieldsSet: {
    userErrors: Array<{field: string[]; message: string}>
  } | null
}

type StoredWishlistItem = {
  productId: string
  productHandle: string
  variantId?: string | null
  addedAt: string
  title?: string
  featuredImage?: {
    url: string
    altText?: string | null
  } | null
  priceRange?: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  variants?: {
    edges: Array<{
      node: {
        id: string
        availableForSale?: boolean
      }
    }>
  }
}

type ClientWishlistItem = {
  id?: string
  productId?: string
  handle?: string
  productHandle?: string
  variantId?: string | null
  addedAt?: string
  title?: string
  featuredImage?: {
    url: string
    altText?: string | null
  } | null
  priceRange?: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  variants?: {
    edges: Array<{
      node: {
        id: string
        availableForSale?: boolean
      }
    }>
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function getStringField(source: Record<string, unknown>, key: string) {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

function getImage(value: unknown): StoredWishlistItem['featuredImage'] | undefined {
  const source = getRecord(value)
  if (!source) return undefined

  const url = getStringField(source, 'url')
  if (!url) return undefined

  const altText = source.altText
  return {
    url,
    altText: typeof altText === 'string' ? altText : null,
  }
}

function getPriceRange(value: unknown): StoredWishlistItem['priceRange'] | undefined {
  const source = getRecord(value)
  const minVariantPrice = getRecord(source?.minVariantPrice)
  if (!minVariantPrice) return undefined

  const amount = getStringField(minVariantPrice, 'amount')
  const currencyCode = getStringField(minVariantPrice, 'currencyCode')
  if (!amount || !currencyCode) return undefined

  return {
    minVariantPrice: {
      amount,
      currencyCode,
    },
  }
}

function getVariants(value: unknown): StoredWishlistItem['variants'] | undefined {
  const source = getRecord(value)
  if (!Array.isArray(source?.edges)) return undefined

  const edges: Array<{node: {id: string; availableForSale?: boolean}}> = []

  source.edges.forEach((edge) => {
    const edgeSource = getRecord(edge)
    const node = getRecord(edgeSource?.node)
    const id = node ? getStringField(node, 'id') : ''
    if (!id || !node) return

    edges.push({
      node: {
        id,
        ...(typeof node.availableForSale === 'boolean'
          ? {availableForSale: node.availableForSale}
          : {}),
      },
    })
  })

  return edges.length > 0 ? {edges} : undefined
}

function getWishlistKey(item: Pick<StoredWishlistItem, 'productId' | 'productHandle'>) {
  return item.productId || `handle:${item.productHandle}`
}

function normalizeWishlistItem(value: unknown): StoredWishlistItem | null {
  const source = getRecord(value)
  if (!source) return null

  const productId = getStringField(source, 'productId') || getStringField(source, 'id')
  const productHandle = getStringField(source, 'productHandle') || getStringField(source, 'handle')
  if (!productId && !productHandle) return null

  const variants = getVariants(source.variants)
  const variantId =
    getStringField(source, 'variantId') ||
    variants?.edges[0]?.node.id ||
    null
  const addedAt = getStringField(source, 'addedAt') || new Date().toISOString()

  return {
    productId,
    productHandle,
    ...(variantId ? {variantId} : {}),
    addedAt,
    title: getStringField(source, 'title') || undefined,
    featuredImage: getImage(source.featuredImage),
    priceRange: getPriceRange(source.priceRange),
    variants,
  }
}

function normalizeWishlist(value: unknown): StoredWishlistItem[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const normalized: StoredWishlistItem[] = []

  value.forEach((item) => {
    const normalizedItem = normalizeWishlistItem(item)
    if (!normalizedItem) return

    const key = getWishlistKey(normalizedItem)
    if (seen.has(key)) return

    seen.add(key)
    normalized.push(normalizedItem)
  })

  return normalized.slice(0, WISHLIST_LIMIT)
}

function parseWishlist(value: string | null | undefined) {
  if (!value) return []

  try {
    return normalizeWishlist(JSON.parse(value))
  } catch (error) {
    serverLogger.warn('wishlist.metafield.invalid_json', error)
    return []
  }
}

function toClientWishlistItem(item: StoredWishlistItem): ClientWishlistItem {
  return {
    id: item.productId,
    productId: item.productId,
    handle: item.productHandle,
    productHandle: item.productHandle,
    variantId: item.variantId,
    addedAt: item.addedAt,
    title: item.title,
    featuredImage: item.featuredImage,
    priceRange: item.priceRange,
    variants: item.variants,
  }
}

function mergeWishlist(existing: StoredWishlistItem[], incoming: StoredWishlistItem[]) {
  const merged = [...existing]

  incoming.forEach((item) => {
    const key = getWishlistKey(item)
    const existingIndex = merged.findIndex((current) => getWishlistKey(current) === key)

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...item,
        addedAt: merged[existingIndex].addedAt || item.addedAt,
      }
      return
    }

    merged.push(item)
  })

  return merged.slice(0, WISHLIST_LIMIT)
}

async function getCustomerId(customerAccessToken: string): Promise<string | null> {
  const query = `#graphql
    query GetCustomerId($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
      }
    }
  `

  try {
    const response = await shopifyClient.request<StorefrontCustomerResponse>(query, {
      customerAccessToken,
    })
    return response.data?.customer?.id || null
  } catch (error) {
    serverLogger.warn('wishlist.customer_lookup.failed', error)
    return null
  }
}

async function getAuthenticatedCustomerId() {
  const cookieStore = await cookies()
  const customerAccessToken = cookieStore.get('customer-access-token')?.value
  if (!customerAccessToken) return null

  return getCustomerId(customerAccessToken)
}

async function readWishlist(customerId: string) {
  const query = `#graphql
    query GetCustomerWishlist($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "${WISHLIST_NAMESPACE}", key: "${WISHLIST_KEY}") {
          value
        }
      }
    }
  `
  const response = await shopifyAdminRequest<WishlistMetafieldResponse>(query, {id: customerId})

  if (response.errors?.length) {
    throw new Error(response.errors[0].message)
  }

  return parseWishlist(response.data?.customer?.metafield?.value)
}

async function writeWishlist(customerId: string, wishlist: StoredWishlistItem[]) {
  const mutation = `#graphql
    mutation SetCustomerWishlist($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `
  const response = await shopifyAdminRequest<MetafieldsSetResponse>(mutation, {
    metafields: [
      {
        ownerId: customerId,
        namespace: WISHLIST_NAMESPACE,
        key: WISHLIST_KEY,
        value: JSON.stringify(wishlist),
        type: WISHLIST_TYPE,
      },
    ],
  })

  if (response.errors?.length) {
    throw new Error(response.errors[0].message)
  }

  const userErrors = response.data?.metafieldsSet?.userErrors
  if (userErrors?.length) {
    throw new Error(userErrors[0].message)
  }
}

function wishlistResponse(wishlist: StoredWishlistItem[]) {
  return Response.json({wishlist: wishlist.map(toClientWishlistItem)})
}

export async function GET() {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    return wishlistResponse(await readWishlist(customerId))
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to fetch wishlist'}},
      {status: 500}
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const body = (await req.json()) as {item?: unknown}
    const item = normalizeWishlistItem(body.item)
    if (!item) {
      return Response.json({error: {message: 'Wishlist item is invalid'}}, {status: 400})
    }

    const wishlist = mergeWishlist(await readWishlist(customerId), [item])
    await writeWishlist(customerId, wishlist)

    return wishlistResponse(wishlist)
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to update wishlist'}},
      {status: 500}
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const body = (await req.json()) as {wishlist?: unknown}
    const wishlist = normalizeWishlist(body.wishlist)
    await writeWishlist(customerId, wishlist)

    return wishlistResponse(wishlist)
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to replace wishlist'}},
      {status: 500}
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const {searchParams} = new URL(req.url)
    const productId = searchParams.get('productId') || searchParams.get('id') || ''
    const productHandle = searchParams.get('productHandle') || searchParams.get('handle') || ''

    if (!productId && !productHandle) {
      return Response.json({error: {message: 'Product identifier is required'}}, {status: 400})
    }

    const wishlist = (await readWishlist(customerId)).filter((item) => {
      if (productId) return item.productId !== productId
      return item.productHandle !== productHandle
    })
    await writeWishlist(customerId, wishlist)

    return wishlistResponse(wishlist)
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to delete wishlist item'}},
      {status: 500}
    )
  }
}
