import { NextRequest } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { GET_CUSTOMER_QUERY } from '@/lib/queries'
import { Customer } from '@/lib/shopify/generated/graphql'

export const GET = async (req: NextRequest) => {
  const accessToken = req.cookies.get('customer-access-token')?.value

  if (!accessToken) {
    return Response.json({ user: null })
  }

  try {
    const response: { data: { customer: Customer } } = await shopifyClient.request(GET_CUSTOMER_QUERY, {
      customerAccessToken: accessToken,
    })

    if (response.errors) {
      // This can happen if the token is expired or invalid
      console.error('Error in /api/auth/me:', response.errors)
      return Response.json({ user: null })
    }

    const { customer } = response.data

    if (!customer) {
      return Response.json({ user: null })
    }

    return Response.json({ user: customer })
  } catch (error) {
    console.error('Error fetching customer data:', error)
    return Response.json({ user: null })
  }
}