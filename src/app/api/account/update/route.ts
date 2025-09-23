import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify'

export async function PUT(request: NextRequest) {
  const customerAccessToken = request.cookies.get(
    'customer-access-token'
  )?.value

  if (!customerAccessToken || customerAccessToken.trim() === '') {
    return NextResponse.json(
      { error: { message: 'Not authenticated or invalid access token.' } },
      { status: 401 }
    )
  }

  const { email, password } = await request.json()

  const query = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer {
          id
          email
          firstName
          lastName
          phone
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `

  const variables: {
    customerAccessToken: string
    customer: { email?: string; password?: string }
  } = {
    customerAccessToken,
    customer: {},
  }

  if (email) {
    variables.customer.email = email
  }

  if (password) {
    variables.customer.password = password
  }

  // Ensure at least one field (email or password) is provided for update
  if (!email && !password) {
    return NextResponse.json(
      {
        error: {
          message: 'No update data provided (email or password missing).',
        },
      },
      { status: 400 }
    )
  }

  // Filter out undefined values from the customer object before sending to Shopify
  Object.keys(variables.customer).forEach((key) => {
    if (
      variables.customer[key as keyof typeof variables.customer] === undefined
    ) {
      delete variables.customer[key as keyof typeof variables.customer]
    }
  })

  try {
    const data = await shopifyClient.request(
      query,
      variables as Record<string, unknown>
    )

    // The Shopify response comes nested under a 'data' property
    const response = data as {
      data?: {
        customerUpdate?: {
          customer?: Record<string, unknown>
          customerUserErrors?: Array<{
            code?: string
            field?: string[]
            message: string
          }>
        }
      }
      errors?: unknown
    }

    // Check for top-level API errors
    if (response.errors) {
      return NextResponse.json(
        {
          error: {
            message: 'Failed to update customer due to Shopify API errors.',
            details: response.errors,
          },
        },
        { status: 500 }
      )
    }

    // Check if we have the expected data structure
    const customerUpdate = response.data?.customerUpdate
    if (!customerUpdate) {
      return NextResponse.json(
        {
          error: {
            message:
              'Failed to update customer due to unexpected API response structure.',
          },
        },
        { status: 500 }
      )
    }

    // Check for customer-specific errors
    if (
      customerUpdate.customerUserErrors &&
      customerUpdate.customerUserErrors.length > 0
    ) {
      return NextResponse.json(
        { errors: customerUpdate.customerUserErrors },
        { status: 400 }
      )
    }

    // Success case - return the updated customer data
    if (customerUpdate.customer) {
      return NextResponse.json({ customer: customerUpdate.customer })
    }

    // Should never reach here if Shopify API contract is maintained
    console.error('Missing customer data in successful response:', data)
    return NextResponse.json(
      {
        error: {
          message:
            'Failed to update customer - missing customer data in response.',
        },
      },
      { status: 500 }
    )
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { message: 'Failed to update customer.' } },
      { status: 500 }
    )
  }
}
