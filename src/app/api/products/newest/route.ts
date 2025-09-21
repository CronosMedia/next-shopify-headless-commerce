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
    const data: { products: ProductConnection } = await shopifyClient.request(NEWEST_PRODUCTS_QUERY, {
      first: 12,
    })

    console.log('Shopify API response:', JSON.stringify(data, null, 2))

    if (!data || !data.products) {
      console.error('Invalid response structure:', data)
      return Response.json(
        { error: 'Invalid response from Shopify API' },
        { status: 500 }
      )
    }

    const products =
      data.products.edges?.map((edge) => edge.node) || []
    return Response.json({ products })
  } catch (error: unknown) {
    console.error('Shopify API error:', error)
    return Response.json(
      { error: (error as Error).message || 'Failed to fetch newest products' },
      { status: 500 }
    )
  }
}
