import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyAdminRequest } from '@/lib/shopify'

const ORDER_TAG_MUTATION = `#graphql
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const POST = async (req: NextRequest) => {
  try {
    // 1. Verify Authentication
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // 2. Extract Data
    const body = await req.json()
    console.log('Cancellation Request Body:', JSON.stringify(body))
    const { orderId, orderName, customerEmail } = body

    if (!orderId || !orderName || !customerEmail) {
      console.error('Missing required fields:', { orderId, orderName, customerEmail })
      return Response.json(
        { error: { message: 'Order ID, name and customer email are required.' } },
        { status: 400 }
      )
    }

    // 3. Fetch existing tags (optional but good for appending)
    // For simplicity, we'll just add the tag. Shopify Admin API orderUpdate 
    // input for tags usually replaces the tags if you provide a new list, 
    // or we can use the tags field. 
    // Actually, orderUpdate input `tags` replaces all tags.
    // To be safe and just add, we should fetch current tags first or use a specialized mutation.

    // Let's use tagsAdd mutation instead if available, or just orderUpdate with a strategy.
    // tagsAdd is available for many objects in Admin API.

    const TAGS_ADD_MUTATION = `#graphql
      mutation tagsAdd($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          node {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    console.log(`Processing cancellation request for ${orderName} (${orderId})`)

    // Clean orderId - Storefront API IDs sometimes include ?key=... which Admin API rejects
    const cleanOrderId = orderId.split('?')[0]

    // 1. Fetch current tags
    const GET_ORDER_TAGS = `#graphql
      query getOrderTags($id: ID!) {
        order(id: $id) {
          id
          tags
        }
      }
    `
    const tagsResponse = await shopifyAdminRequest<any>(GET_ORDER_TAGS, { id: cleanOrderId })

    if (tagsResponse.errors) {
      console.error('Error fetching order tags:', tagsResponse.errors)
      throw new Error(tagsResponse.errors[0]?.message || 'Failed to fetch order tags for update')
    }

    const currentTags = tagsResponse.data?.order?.tags || []
    const newTag = 'Cancellation Requested'

    // Check if tag already exists
    if (!currentTags.includes(newTag)) {
      const updatedTags = [...currentTags, newTag].join(', ')

      const ORDER_UPDATE_MUTATION = `#graphql
          mutation orderUpdate($input: OrderInput!) {
            orderUpdate(input: $input) {
              order {
                id
                tags
              }
              userErrors {
                field
                message
              }
            }
          }
        `

      const updateResponse = await shopifyAdminRequest<any>(ORDER_UPDATE_MUTATION, {
        input: {
          id: cleanOrderId,
          tags: updatedTags
        }
      })

      if (updateResponse.errors) {
        console.error('Error updating order tags:', updateResponse.errors)
        throw new Error(updateResponse.errors[0]?.message || 'Failed to update order tags')
      }

      const { userErrors } = updateResponse.data.orderUpdate
      if (userErrors && userErrors.length > 0) {
        console.error('Shopify Order Update User Errors:', userErrors)
        throw new Error(userErrors[0].message)
      }
    } else {
      console.log('Order already has cancellation tag.')
    }

    // 4. Send "mock" email as well for logging/secondary notification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    console.log('--- Order Cancellation Request (Tagged in Shopify) ---')
    console.log(`Order: ${orderName} (${orderId})`)
    console.log(`Customer: ${customerEmail}`)
    console.log('----------------------------------------------------')

    return Response.json({
      success: true,
      message: 'Cancellation request sent and order tagged.',
    })
  } catch (error: any) {
    console.error('Cancellation Request Error:', error)
    return Response.json(
      {
        error: {
          message: error.message || 'Failed to process cancellation request.',
        },
      },
      { status: 500 }
    )
  }
}
