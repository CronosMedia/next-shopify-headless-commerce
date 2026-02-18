import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyClient } from '@/lib/shopify'
import { cartBuyerIdentityUpdate } from '@/lib/cart'
import {
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
} from '@/lib/queries'
import {
  CustomerCreatePayload,
  CustomerAccessTokenCreatePayload,
  Customer,
} from '@/lib/shopify/generated/graphql'
import { GraphQLResponse } from '@/lib/shopify'

export const POST = async (req: NextRequest) => {
  try {
    const { email, password, firstName, lastName, cartId } = await req.json()

    // 1. Create the customer in Shopify
    const createData = (await shopifyClient.request(
      CUSTOMER_CREATE_MUTATION,
      {
        input: { email, password, firstName, lastName },
      }
    )) as GraphQLResponse<{ customerCreate: CustomerCreatePayload }>

    const { customer, customerUserErrors } = createData.data.customerCreate

    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: { message: customerUserErrors[0].message } },
        { status: 400 }
      )
    }

    if (!customer) {
      return Response.json(
        { error: { message: 'Could not create customer' } },
        { status: 500 }
      )
    }

    // 2. Log in the new customer to get an access token
    const tokenData = (await shopifyClient.request(
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      {
        input: { email, password },
      }
    )) as GraphQLResponse<{ customerAccessTokenCreate: CustomerAccessTokenCreatePayload }>

    const { customerAccessToken, customerUserErrors: tokenUserErrors } =
      tokenData.data.customerAccessTokenCreate

    if (tokenUserErrors?.length > 0) {
      return Response.json(
        { error: { message: tokenUserErrors[0].message } },
        { status: 401 }
      )
    }

    if (!customerAccessToken?.accessToken) {
      return Response.json(
        { error: { message: 'Could not log in after registration' } },
        { status: 500 }
      )
    }

    const { accessToken, expiresAt } = customerAccessToken

    // 3. Fetch the full customer object to return to the client (to include addresses etc)
    const { GET_CUSTOMER_QUERY } = await import('@/lib/queries')
    const customerResponse = (await shopifyClient.request(GET_CUSTOMER_QUERY, {
      customerAccessToken: accessToken,
    })) as GraphQLResponse<{ customer: Customer }>

    const finalCustomer = customerResponse.data?.customer || tokenData.data.customerAccessTokenCreate.customerAccessToken

    // 4. If a cartId is provided, associate it with the new customer
    if (cartId) {
      await cartBuyerIdentityUpdate(cartId, {
        customerAccessToken: accessToken,
      })
    }

    // 5. Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set('customer-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expiresAt),
    })

    if (finalCustomer?.id) {
      cookieStore.set('customer-shopify-id', finalCustomer.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(expiresAt),
      })
    }

    return Response.json({ user: finalCustomer })
  } catch (error: any) {
    console.error('Registration Route Error:', error)
    return Response.json(
      { error: { message: error.message || 'Registration failed' } },
      { status: 500 }
    )
  }
}
