import 'server-only'

type GraphQLError = {
  message: string
}

export type AdminGraphQLResponse<T> = {
  data?: T
  errors?: GraphQLError[]
}

export async function shopifyAdminRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<AdminGraphQLResponse<T>> {
  const adminDomain = process.env.SHOPIFY_STORE_DOMAIN
  const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
  const adminVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-04'

  if (!adminDomain || !adminToken) {
    throw new Error('Missing Shopify Admin API configuration')
  }

  const response = await fetch(
    `https://${adminDomain}/admin/api/${adminVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({query, variables}),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Shopify Admin API request failed (${response.status})`)
  }

  return response.json() as Promise<AdminGraphQLResponse<T>>
}
