import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import { cartBuyerIdentityUpdate } from '@/lib/cart'
import {
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  GET_CUSTOMER_QUERY,
} from '@/lib/queries'
import {
  CustomerAccessTokenCreatePayload,
  Customer,
} from '@/lib/shopify/generated/graphql'
import { GraphQLResponse } from '@/lib/shopify'

export const POST = async (req: NextRequest) => {
  try {
    const { email, password, cartId } = await req.json()

    // 1. Authenticate customer and get access token
    const tokenResponse = (await shopifyClient.request(
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      {
        input: {
          email,
          password,
        },
      }
    )) as GraphQLResponse<{ customerAccessTokenCreate: CustomerAccessTokenCreatePayload }>

    if (tokenResponse.errors) {
      const message =
        tokenResponse.errors[0]?.message || 'An error occurred during login.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { customerAccessToken, customerUserErrors } =
      tokenResponse.data.customerAccessTokenCreate

    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: { message: customerUserErrors[0].message } },
        { status: 401 }
      )
    }

    if (!customerAccessToken?.accessToken) {
      return Response.json(
        { error: { message: 'Invalid credentials' } },
        { status: 401 }
      )
    }

    const { accessToken, expiresAt } = customerAccessToken

    // 2. If a cartId is provided, associate it with the customer
    if (cartId) {
      await cartBuyerIdentityUpdate(cartId, {
        customerAccessToken: accessToken,
      })
    }

    // 3. Fetch the full customer object to return to the client
    const customerResponse = (await shopifyClient.request(GET_CUSTOMER_QUERY, {
      customerAccessToken: accessToken,
    })) as GraphQLResponse<{ customer: Customer }>

    if (customerResponse.errors) {
      const message =
        customerResponse.errors[0]?.message ||
        'An error occurred fetching customer data.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { customer } = customerResponse.data

    if (!customer) {
      return Response.json(
        { error: { message: 'Customer not found' } },
        { status: 404 }
      )
    }

    const response = NextResponse.json({ user: customer })
    // 4. Set the session cookies
    response.cookies.set('customer-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expiresAt),
    })
    response.cookies.set('customer-shopify-id', customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expiresAt),
    })

    return response
  } catch (error: unknown) {
    console.error("Login API Error:", error) // Log the actual error
    return Response.json(
      { error: { message: 'An unexpected error occurred during login.' } },
      { status: 500 }
    )
  }
}