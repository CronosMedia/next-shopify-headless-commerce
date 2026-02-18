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


type SearchProductsResponse = {
  products: {
    edges: Array<{
      node: {
        id: string
        handle: string
        title: string
        description: string
        featuredImage: {
          url: string
          altText: string
          width: number
          height: number
        } | null
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: string }
        }
      }
    }>
  }
}

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

    const response = await shopifyClient.request<SearchProductsResponse>(SEARCH_PRODUCTS_QUERY, {
      query,
      first: 20, // Fetch up to 20 results
    })

    const data = response.data

    return NextResponse.json({
      products: data?.products?.edges.map((edge: any) => edge.node) || [],
    })
  } catch (error: unknown) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: { message: (error as Error).message || 'Failed to perform search' } },
      { status: 500 }
    )
  }
}
