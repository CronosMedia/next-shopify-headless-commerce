import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/queries'
import { Product } from '@/lib/shopify/generated/graphql'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params

    if (!handle) {
      return NextResponse.json(
        { error: 'Product handle is required' },
        { status: 400 }
      )
    }

    const response = await shopifyClient.request<{ product: Product }>(PRODUCT_BY_HANDLE_QUERY, {
      handle,
    })

    const product = response.data?.product

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
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
