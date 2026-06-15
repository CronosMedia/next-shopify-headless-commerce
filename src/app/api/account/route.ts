import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyClient } from '@/lib/shopify'
import {
  CUSTOMER_UPDATE_MUTATION,
  GET_CUSTOMER_QUERY,
} from '@/lib/queries'
import { Customer, CustomerUpdateInput } from '@/lib/shopify/generated/graphql'
import {serverLogger} from '@/lib/logger.server'

type CustomerUpdateData = {
  customerUpdate: {
    customer: Customer | null
    customerUserErrors: Array<{message: string}>
  } | null
}

export const GET = async () => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {data} = await shopifyClient.request<{customer: Customer | null}>(
      GET_CUSTOMER_QUERY,
      {customerAccessToken: accessToken}
    )
    const customer = data.customer

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }

    return Response.json({ customer })
  } catch (error: unknown) {
    return Response.json(
      { error: (error as Error).message || 'Failed to fetch customer data' },
      { status: 500 }
    )
  }
}

export const PUT = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { firstName, lastName, email, phone } = await req.json()

    const customerData: CustomerUpdateInput = { firstName, lastName, email, phone }
    Object.keys(customerData).forEach((key) => {
      if (customerData[key as keyof typeof customerData] === undefined) {
        delete customerData[key as keyof typeof customerData]
      }
    })

    const updateData = await shopifyClient.request<CustomerUpdateData>(
      CUSTOMER_UPDATE_MUTATION,
      {
        customer: customerData,
        customerAccessToken: accessToken,
      }
    )

    // Correctly access customerUpdate from updateData.data
    const customerUpdateResult = updateData.data?.customerUpdate; // Use optional chaining for safety

    // Check if customerUpdateResult is missing
    if (!customerUpdateResult) {
      serverLogger.error('account.update.empty_response')
      return Response.json(
        { error: 'Failed to update account: Unexpected response from Shopify.' },
        { status: 500 }
      );
    }

    // Now, safely access customer and customerUserErrors from customerUpdateResult
    const customer = customerUpdateResult.customer;
    const customerUserErrors = customerUpdateResult.customerUserErrors;

    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: customerUserErrors[0].message },
        { status: 400 }
      );
    }

    // If customer is null even without user errors, it's still an issue
    if (!customer) {
        serverLogger.error('account.update.missing_customer')
        return Response.json(
            { error: 'Failed to update account: Customer object is null or missing.' },
            { status: 500 }
        );
    }

    return Response.json({ customer: customer })
  } catch (error: unknown) {
    serverLogger.error('account.update.failed', error)
    return Response.json(
      { error: (error as Error).message || 'Failed to update account' },
      { status: 500 }
    )
  }
}
