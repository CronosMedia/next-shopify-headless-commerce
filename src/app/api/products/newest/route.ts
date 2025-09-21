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

export async function GET() {
  try {
    const response = await shopifyClient.request(NEWEST_PRODUCTS_QUERY, { // Renamed data to response
      first: 12,
    })

    const data = response.data; // Access the nested data property

    let products: any[] = [];
    if (data && data.products && data.products.edges) {
      products = data.products.edges;
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
