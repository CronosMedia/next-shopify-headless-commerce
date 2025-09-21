import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: {
    'https://proteinshopro.myshopify.com/api/2024-10/graphql.json': {
      headers: {
        'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
    },
  },
  documents: ['src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './src/lib/shopify/generated/': {
      preset: 'client',
      plugins: ['typescript', 'typescript-operations'],
    },
  },
}

export default config
