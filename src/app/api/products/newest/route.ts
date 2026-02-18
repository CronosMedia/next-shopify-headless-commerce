import { shopifyClient } from '@/lib/shopify'
import { ProductConnection } from '@/lib/shopify/generated/graphql'

const NEWEST_PRODUCTS_QUERY = `#graphql
  query NewestProducts($first: Int = 12) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
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
            minVariantPrice { amount currencyCode }
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
    }
  }
`

// Define the expected response type
type NewestProductsResponse = {
  products: {
    edges: Array<{
      node: {
        id: string
        handle: string
        title: string
        featuredImage: {
          url: string
          altText: string
          width: number
          height: number
        } | null
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: string }
        }
        variants: {
          edges: Array<{
            node: {
              id: string
              availableForSale: boolean
            }
          }>
        }
      }
    }>
  }
}

export async function GET() {
  try {
    const response = await shopifyClient.request<NewestProductsResponse>(NEWEST_PRODUCTS_QUERY, { // Pass type argument
      first: 12,
    })

    const data = response.data;

    let products: any[] = [];
    if (data && data.products && data.products.edges) {
      products = data.products.edges.map((edge) => edge.node);
    }
    return Response.json({ products })
  } catch (error: unknown) {
    console.error('Shopify API error:', error)
    return Response.json(
      { error: (error as Error).message || 'Failed to fetch newest products' },
      { status: 500 }
    )
  }
}
