import { NextRequest } from 'next/server'
import { shopifyClient } from '@/lib/shopify'
import {
  GET_CUSTOMER_QUERY,
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
  CUSTOMER_ADDRESS_DELETE_MUTATION,
  CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
} from '@/lib/queries'
import {
  Customer,
  MailingAddress,
  CustomerAddressCreatePayload,
  CustomerAddressUpdatePayload,
  CustomerAddressDeletePayload,
  CustomerDefaultAddressUpdatePayload,
} from '@/lib/shopify/generated/graphql'

// Get all addresses
export const GET = async (req: NextRequest) => {
  const customerAccessToken = req.cookies.get('customer-access-token')?.value
  if (!customerAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const response = await shopifyClient.request<{ customer: Customer }>(
      GET_CUSTOMER_QUERY,
      {
        customerAccessToken,
      }
    )

    if (response.errors) {
      const message =
        response.errors[0]?.message || 'An error occurred fetching addresses.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    if (!response.data.customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }

    const { addresses, defaultAddress } = response.data.customer
    return Response.json({
      addresses: addresses.edges.map((edge) => edge.node),
      defaultAddress,
    })
  } catch (error: unknown) {
    return Response.json(
      { error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// Create a new address
export const POST = async (req: NextRequest) => {
  const customerAccessToken = req.cookies.get('customer-access-token')?.value
  if (!customerAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { address }: { address: MailingAddress } = await req.json()

    const response = await shopifyClient.request<{ customerAddressCreate: CustomerAddressCreatePayload }>(
      CUSTOMER_ADDRESS_CREATE_MUTATION,
      {
        customerAccessToken,
        address,
      }
    )

    if (response.errors) {
      const message =
        response.errors[0]?.message || 'An error occurred creating the address.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { customerAddress, customerUserErrors } =
      response.data.customerAddressCreate
    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: customerUserErrors[0].message },
        { status: 400 }
      )
    }

    return Response.json({ address: customerAddress })
  } catch (error: unknown) {
    return Response.json(
      { error: error.message || 'Failed to create address' },
      { status: 500 }
    )
  }
}

// Update an address
export const PUT = async (req: NextRequest) => {
  const customerAccessToken = req.cookies.get('customer-access-token')?.value
  if (!customerAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { id, address }: { id: string; address: MailingAddress } = await req.json()
    if (!id) {
      return Response.json({ error: 'Address ID is required' }, { status: 400 })
    }

    const response = await shopifyClient.request<{ customerAddressUpdate: CustomerAddressUpdatePayload }>(
      CUSTOMER_ADDRESS_UPDATE_MUTATION,
      {
        customerAccessToken,
        id,
        address,
      }
    )

    if (response.errors) {
      const message =
        response.errors[0]?.message || 'An error occurred updating the address.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { customerAddress, customerUserErrors } = response.data.customerAddressUpdate
    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: customerUserErrors[0].message },
        { status: 400 }
      )
    }

    return Response.json({ address: customerAddress })
  } catch (error: unknown) {
    return Response.json(
      { error: error.message || 'Failed to update address' },
      { status: 500 }
    )
  }
}

// Delete an address
export const DELETE = async (req: NextRequest) => {
  const customerAccessToken = req.cookies.get('customer-access-token')?.value
  if (!customerAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { id }: { id: string } = await req.json()
    if (!id) {
      return Response.json({ error: 'Address ID is required' }, { status: 400 })
    }

    const response = await shopifyClient.request<{ customerAddressDelete: CustomerAddressDeletePayload }>(
      CUSTOMER_ADDRESS_DELETE_MUTATION,
      {
        customerAccessToken,
        id,
      }
    )

    if (response.errors) {
      const message =
        response.errors[0]?.message || 'An error occurred deleting the address.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { deletedCustomerAddressId, customerUserErrors } =
      response.data.customerAddressDelete
    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: customerUserErrors[0].message },
        { status: 400 }
      )
    }

    return Response.json({ deletedAddressId: deletedCustomerAddressId })
  } catch (error: unknown) {
    return Response.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}

// Set default address
export const PATCH = async (req: NextRequest) => {
  const customerAccessToken = req.cookies.get('customer-access-token')?.value
  if (!customerAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { addressId }: { addressId: string } = await req.json()
    if (!addressId) {
      return Response.json({ error: 'Address ID is required' }, { status: 400 })
    }

    const response = await shopifyClient.request<{
      customerDefaultAddressUpdate: CustomerDefaultAddressUpdatePayload
    }>(
      CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
      {
        customerAccessToken,
        addressId,
      }
    )

    if (response.errors) {
      const message =
        response.errors[0]?.message ||
        'An error occurred setting the default address.'
      return Response.json({ error: { message } }, { status: 400 })
    }

    const { customer, customerUserErrors } = response.data.customerDefaultAddressUpdate
    if (customerUserErrors?.length > 0) {
      return Response.json(
        { error: customerUserErrors[0].message },
        { status: 400 }
      )
    }

    return Response.json({ customer })
  } catch (error: unknown) {
    return Response.json(
      { error: error.message || 'Failed to set default address' },
      { status: 500 }
    )
  }
}