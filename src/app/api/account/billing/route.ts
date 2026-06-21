import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyClient } from '@/lib/shopify'
import { shopifyAdminRequest } from '@/lib/shopify/admin.server'

type BillingProfile = {
  id?: string
  alias: string
  type: 'personal' | 'business'
  firstName?: string
  lastName?: string
  companyName?: string
  cui?: string
  regCom?: string
  address: string
  city: string
  province: string
  zip: string
  phone: string
  isVatPayer?: boolean
  isEInvoiceActive?: boolean
}

// Get Customer ID via Storefront API
async function getCustomerId(customerAccessToken: string): Promise<string | null> {
  const query = `#graphql
    query GetCustomerId($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
      }
    }
  `
  try {
    const response = await shopifyClient.request<{ customer: { id: string } | null }>(query, {
      customerAccessToken,
    })
    return response.data?.customer?.id || null
  } catch {
    return null
  }
}

// Fetch billing profiles from metafields
export async function GET() {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get('customer-access-token')?.value
    if (!customerAccessToken) {
      return Response.json({ error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const customerId = await getCustomerId(customerAccessToken)
    if (!customerId) {
      return Response.json({ error: { message: 'Customer not found' } }, { status: 404 })
    }

    const query = `#graphql
      query GetCustomerMetafields($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "custom", key: "billing_profiles") {
            value
          }
        }
      }
    `
    const adminResponse = await shopifyAdminRequest<{
      customer: {
        metafield: { value: string } | null
      } | null
    }>(query, { id: customerId })

    if (adminResponse.errors?.length) {
      return Response.json({ error: { message: adminResponse.errors[0].message } }, { status: 400 })
    }

    const metafieldValue = adminResponse.data?.customer?.metafield?.value
    let billingProfiles: BillingProfile[] = []
    if (metafieldValue) {
      try {
        const parsed = JSON.parse(metafieldValue)
        if (Array.isArray(parsed)) {
          billingProfiles = parsed as BillingProfile[]
        }
      } catch {
        billingProfiles = []
      }
    }

    return Response.json({ billingProfiles })
  } catch (error: unknown) {
    return Response.json(
      { error: { message: (error as Error).message || 'Failed to fetch billing profiles' } },
      { status: 500 }
    )
  }
}

// Save or delete a billing profile
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get('customer-access-token')?.value
    if (!customerAccessToken) {
      return Response.json({ error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const customerId = await getCustomerId(customerAccessToken)
    if (!customerId) {
      return Response.json({ error: { message: 'Customer not found' } }, { status: 404 })
    }

    const { action, profile, profileId } = await req.json() as {
      action?: string
      profile?: BillingProfile
      profileId?: string
    }

    if (!action || (action !== 'save' && action !== 'delete')) {
      return Response.json({ error: { message: 'Invalid action' } }, { status: 400 })
    }

    // 1. Get current profiles
    const getQuery = `#graphql
      query GetCustomerMetafields($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "custom", key: "billing_profiles") {
            value
          }
        }
      }
    `
    const adminResponse = await shopifyAdminRequest<{
      customer: {
        metafield: { value: string } | null
      } | null
    }>(getQuery, { id: customerId })

    const metafieldValue = adminResponse.data?.customer?.metafield?.value
    let billingProfiles: BillingProfile[] = []
    if (metafieldValue) {
      try {
        const parsed = JSON.parse(metafieldValue)
        if (Array.isArray(parsed)) {
          billingProfiles = parsed as BillingProfile[]
        }
      } catch {
        billingProfiles = []
      }
    }

    // 2. Perform action
    if (action === 'save') {
      if (!profile) {
        return Response.json({ error: { message: 'Profile data required' } }, { status: 400 })
      }
      if (profile.id) {
        // Update existing profile
        billingProfiles = billingProfiles.map((p) => (p.id === profile.id ? profile : p))
      } else {
        // Add new profile
        const newProfile: BillingProfile = {
          ...profile,
          id: `billing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        }
        billingProfiles.push(newProfile)
      }
    } else if (action === 'delete') {
      const targetId = profileId || profile?.id
      if (!targetId) {
        return Response.json({ error: { message: 'Profile ID required for deletion' } }, { status: 400 })
      }
      billingProfiles = billingProfiles.filter((p) => p.id !== targetId)
    }

    // 3. Save profiles back to metafield
    const setMutation = `#graphql
      mutation SetCustomerMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `
    const setResponse = await shopifyAdminRequest<{
      metafieldsSet: {
        metafields: Array<{ id: string; value: string }> | null
        userErrors: Array<{ field: string[]; message: string }>
      } | null
    }>(setMutation, {
      metafields: [
        {
          ownerId: customerId,
          namespace: 'custom',
          key: 'billing_profiles',
          value: JSON.stringify(billingProfiles),
          type: 'json',
        },
      ],
    })

    if (setResponse.errors?.length) {
      return Response.json({ error: { message: setResponse.errors[0].message } }, { status: 400 })
    }

    const setErrors = setResponse.data?.metafieldsSet?.userErrors
    if (setErrors?.length) {
      return Response.json({ error: { message: setErrors[0].message } }, { status: 400 })
    }

    return Response.json({ billingProfiles })
  } catch (error: unknown) {
    return Response.json(
      { error: { message: (error as Error).message || 'Failed to update billing profiles' } },
      { status: 500 }
    )
  }
}
