import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient, GraphQLResponse } from '@/lib/shopify'
import { GET_CUSTOMER_QUERY } from '@/lib/queries'
import { Customer } from '@/lib/shopify/generated/graphql'

export const GET = async (req: NextRequest) => {
  const accessToken = req.cookies.get('customer-access-token')?.value

  if (!accessToken) {
    return Response.json({ user: null })
  }

  try {
    const response = (await shopifyClient.request(GET_CUSTOMER_QUERY, {
      customerAccessToken: accessToken,
    })) as GraphQLResponse<{ customer: Customer }>

    if (response.errors) {
      // This can happen if the token is expired or invalid
      console.error('Error in /api/auth/me:', response.errors)
      return Response.json({ user: null })
    }

    const { customer } = response.data

    if (!customer) {
      return Response.json({ user: null })
    }

    const nextResponse = NextResponse.json({ user: customer })

    // Recovery logic: if the shopify-id cookie is missing, set it
    const shopifyIdCookie = req.cookies.get('customer-shopify-id')?.value
    if (!shopifyIdCookie && customer.id) {
      nextResponse.cookies.set('customer-shopify-id', customer.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    return nextResponse
  } catch (error) {
    console.error('Error fetching customer data:', error)
    return Response.json({ user: null })
  }
}