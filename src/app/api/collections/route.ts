import { shopifyClient } from '@/lib/shopify'
import { CollectionConnection } from '@/lib/shopify/generated/graphql'
import {serverLogger} from '@/lib/logger.server'

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int = 10) {
    collections(first: $first) {
      edges { 
        node { 
          id 
          handle 
          title 
          description
          image {
            url
            altText
            width
            height
          }
        } 
      }
    }
  }
`

export async function GET() {
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

    if (!domain || !token) {
      return Response.json({ collections: [] })
    }

    const {data} = await shopifyClient.request<{
      collections: CollectionConnection
    }>(COLLECTIONS_QUERY, {first: 250})

    const collections = (data?.collections?.edges || []).map(
      (e) => e.node
    )
    return Response.json({ collections })
  } catch (error) {
    serverLogger.error('collections.list.failed', error)
    return Response.json({ collections: [] })
  }
}
