import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { cartBuyerIdentityUpdate } from '@/lib/cart'

export const POST = async (req: NextRequest) => {
  try {
    const { cartId } = await req.json()

    // 1. If a cartId is provided, disassociate it from the customer
    if (cartId) {
      await cartBuyerIdentityUpdate(cartId, {
        // Passing an empty customerAccessToken would work, but Shopify's API
        // is more stable if you provide a valid, albeit anonymous, email.
        email: `anonymous-${Date.now()}@example.com`,
      })
    }

    // 2. Delete the session cookie
    const cookieStore = await cookies()
    cookieStore.delete('customer-access-token')

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Logout failed' }, { status: 500 })
  }
}