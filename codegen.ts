import type { CodegenConfig } from '@graphql-codegen/cli'

const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const apiVersion =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION || '2026-04'

if (!storeDomain || !storefrontToken) {
  throw new Error(
    'Shopify Storefront environment variables are required for codegen'
  )
}

const config: CodegenConfig = {
  schema: {
    [`https://${storeDomain}/api/${apiVersion}/graphql.json`]: {
      headers: {
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
    },
  },
  documents: ['src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './src/lib/shopify/generated/graphql.ts': {
      config: {
        scalars: {
          DateTime: 'string',
          ISO8601DateTime: 'string',
        },
      },
      plugins: ['typescript', 'typescript-operations'],
    },
  },
}

export default config
