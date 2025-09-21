import { notFound } from 'next/navigation'
import { shopifyClient } from '@/lib/shopify'
import { PRODUCT_BY_HANDLE_QUERY, RELATED_PRODUCTS_QUERY } from '@/lib/queries'
import ProductView from './ProductView' // Import the new client component

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const data: any = await shopifyClient.request(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  })

  if (!data?.data?.product) {
    return notFound()
  }

  const product = data.data.product

  // Fetch related products
  const relatedData: any = await shopifyClient.request(RELATED_PRODUCTS_QUERY, {
    productId: product.id,
    first: 4,
  })
  const relatedProducts = (relatedData?.data?.products?.edges ?? []).map(
    (e: any) => ({
      ...e.node,
      variants: e.node.variants?.edges?.map((v: any) => v.node) ?? [],
    })
  )

  return <ProductView product={product} relatedProducts={relatedProducts} />
}
