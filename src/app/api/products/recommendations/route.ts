import { shopifyClient } from '@/lib/shopify'
import { NextRequest } from 'next/server'
import {serverLogger} from '@/lib/logger.server'

type ProductRecommendationsData = {
  productRecommendations: Array<{
    id: string
    handle: string
    title: string
  }> | null
}

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query productRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      handle
      title
      featuredImage {
        url
        altText
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 5) {
        edges {
          node {
            id
            availableForSale
          }
        }
      }
    }
  }
`

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get('productId')

  if (!productId) {
    return Response.json({ error: 'productId is required' }, { status: 400 })
  }

  try {
    const response = await shopifyClient.request<ProductRecommendationsData>(
      PRODUCT_RECOMMENDATIONS_QUERY,
      { productId }
    )

    const data = response.data
    const products = data?.productRecommendations || []
    return Response.json({ products })
  } catch (error: unknown) {
    serverLogger.error('products.recommendations.failed', error)
    return Response.json(
      { error: (error as Error).message || 'Failed to fetch product recommendations' },
      { status: 500 }
    )
  }
}
