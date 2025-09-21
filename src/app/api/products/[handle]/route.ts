import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/queries'
import { Product } from '@/lib/shopify/generated/graphql'

export const GET = async (req: NextRequest) => {
  try {
    const handle = req.nextUrl.pathname.split('/').pop()

    if (!handle) {
      return NextResponse.json(
        { error: 'Product handle is required' },
        { status: 400 }
      )
    }

    const data: { product: Product } = await shopifyClient.request(PRODUCT_BY_HANDLE_QUERY, {
      handle,
    })

    if (!data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product: data.product })
  } catch (error: unknown) {
    console.error('Product API error:', error)
    return NextResponse.json(
      {
        error: { message: (error as Error).message || 'Failed to fetch product details' },
      },
      { status: 500 }
    )
  }
}
