import { shopifyClient } from '@/lib/shopify'
import { NextRequest } from 'next/server'
import { Product } from '@/lib/shopify/generated/graphql'

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
    const data: { productRecommendations: Product[] } = await shopifyClient.request(
      PRODUCT_RECOMMENDATIONS_QUERY,
      { productId }
    )

    if (!data || !data.productRecommendations) {
      console.error('Invalid response structure:', data)
      return Response.json(
        { error: 'Invalid response from Shopify API for recommendations' },
        { status: 500 }
      )
    }

    const products = data.productRecommendations || []
    return Response.json({ products })
  } catch (error: unknown) {
    console.error('Shopify API error:', error)
    return Response.json(
      { error: (error as Error).message || 'Failed to fetch product recommendations' },
      { status: 500 }
    )
  }
}
