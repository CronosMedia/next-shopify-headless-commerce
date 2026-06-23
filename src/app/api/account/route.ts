import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyClient } from '@/lib/shopify'
import {
  CUSTOMER_UPDATE_MUTATION,
  GET_CUSTOMER_QUERY,
} from '@/lib/queries'
import { Customer, CustomerUpdateInput } from '@/lib/shopify/generated/graphql'
import {serverLogger} from '@/lib/logger.server'
import {normalizeRomanianPhoneForShopify} from '@/lib/phone'

type CustomerUpdateData = {
  customerUpdate: {
    customer: Customer | null
    customerUserErrors: Array<{message: string}>
  } | null
}

type AccountUpdatePayload = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  password?: string
}

export const GET = async () => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json({ error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const response = await shopifyClient.request<{customer: Customer | null}>(
      GET_CUSTOMER_QUERY,
      {customerAccessToken: accessToken}
    )

    if (response.errors?.length) {
      return Response.json({ error: { message: response.errors[0].message } }, { status: 400 })
    }

    const customer = response.data.customer
    if (!customer) {
      return Response.json({ error: { message: 'Customer not found' } }, { status: 404 })
    }

    return Response.json({ customer })
  } catch (error: unknown) {
    return Response.json(
      { error: { message: (error as Error).message || 'Failed to fetch customer data' } },
      { status: 500 }
    )
  }
}

export const PUT = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json({ error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const { firstName, lastName, email, phone, password } =
      (await req.json()) as AccountUpdatePayload

    const customerData: CustomerUpdateInput = {
      firstName,
      lastName,
      email,
      phone: normalizeRomanianPhoneForShopify(phone),
      password,
    }
    Object.keys(customerData).forEach((key) => {
      if (customerData[key as keyof typeof customerData] === undefined) {
        delete customerData[key as keyof typeof customerData]
      }
    })

    // Ensure at least one field is provided for update
    if (Object.keys(customerData).length === 0) {
      return Response.json(
        { error: { message: 'No update data provided.' } },
        { status: 400 }
      )
    }

    const updateData = await shopifyClient.request<CustomerUpdateData>(
      CUSTOMER_UPDATE_MUTATION,
      {
        customer: customerData,
        customerAccessToken: accessToken,
      }
    )

    if (updateData.errors?.length) {
      return Response.json(
        { error: { message: updateData.errors[0].message } },
        { status: 400 }
      )
    }

    const customerUpdateResult = updateData.data?.customerUpdate
    if (!customerUpdateResult) {
      serverLogger.error('account.update.empty_response')
      return Response.json(
        { error: { message: 'Failed to update account: Unexpected response from Shopify.' } },
        { status: 500 }
      )
    }

    const customer = customerUpdateResult.customer
    const customerUserErrors = customerUpdateResult.customerUserErrors

    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: { message: customerUserErrors[0].message } },
        { status: 400 }
      )
    }

    if (!customer) {
      serverLogger.error('account.update.missing_customer')
      return Response.json(
        { error: { message: 'Failed to update account: Customer object is null or missing.' } },
        { status: 500 }
      )
    }

    return Response.json({ customer })
  } catch (error: unknown) {
    serverLogger.error('account.update.failed', error)
    return Response.json(
      { error: { message: (error as Error).message || 'Failed to update account' } },
      { status: 500 }
    )
  }
}
