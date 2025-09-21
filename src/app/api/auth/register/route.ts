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
} from '@/lib/shopify/generated/graphql'

export const POST = async (req: NextRequest) => {
  try {
    const { email, password, firstName, lastName, cartId } = await req.json()

    // 1. Create the customer in Shopify
    const createData: { data: { customerCreate: CustomerCreatePayload } } = await shopifyClient.request(
      CUSTOMER_CREATE_MUTATION,
      {
        input: { email, password, firstName, lastName },
      }
    )

    const { customer, customerUserErrors } = createData.customerCreate

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
    const tokenData: { data: { customerAccessTokenCreate: CustomerAccessTokenCreatePayload } } = await shopifyClient.request(
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      {
        input: { email, password },
      }
    )

    const { customerAccessToken, customerUserErrors: tokenUserErrors } =
      tokenData.customerAccessTokenCreate

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

    // 3. If a cartId is provided, associate it with the new customer
    if (cartId) {
      await cartBuyerIdentityUpdate(cartId, {
        customerAccessToken: accessToken,
      })
    }

    // 4. Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set('customer-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expiresAt),
    })

    return Response.json({ user: customer })
  } catch (error: unknown) {
    return Response.json(
      { error: { message: error.message || 'Registration failed' } },
      { status: 500 }
    )
  }
}
