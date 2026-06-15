import { notFound } from 'next/navigation'
import { shopifyClient } from '@/lib/shopify'
import {PRODUCT_BY_HANDLE_QUERY} from '@/lib/queries'
import ProductView, {type ProductViewProduct} from './ProductView'

type ProductData = {
  product: ProductViewProduct | null
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const {data} = await shopifyClient.request<ProductData>(
    PRODUCT_BY_HANDLE_QUERY,
    {
    handle,
    }
  )

  if (!data.product) {
    return notFound()
  }

  return <ProductView product={data.product} />
}
