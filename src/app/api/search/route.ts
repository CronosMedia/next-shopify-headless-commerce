import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { ProductConnection } from '@/lib/shopify/generated/graphql'

const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts($query: String!, $first: Int = 12) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const data: { products: ProductConnection } = await shopifyClient.request(SEARCH_PRODUCTS_QUERY, {
      query,
      first: 20, // Fetch up to 20 results
    })

    return NextResponse.json({
      products: data.products.edges.map((edge) => edge.node),
    })
  } catch (error: unknown) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: { message: (error as Error).message || 'Failed to perform search' } },
      { status: 500 }
    )
  }
}
