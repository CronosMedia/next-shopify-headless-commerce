import {cookies} from 'next/headers'
import {NextRequest} from 'next/server'
import {shopifyStorefrontRequest} from '@/lib/shopify'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {serverLogger} from '@/lib/logger.server'

const CUSTOMER_ORDERS_QUERY = `#graphql
  query CustomerOrdersForCancellation(
    $customerAccessToken: String!
    $first: Int!
  ) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

const TAGS_ADD_MUTATION = `#graphql
  mutation AddCancellationRequestTag($id: ID!, $tags: [String!]!) {
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

type CustomerOrdersData = {
  customer: {
    orders: {
      edges: Array<{
        node: {
          id: string
          name: string
        }
      }>
    }
  } | null
}

type TagsAddData = {
  tagsAdd: {
    node: {id: string} | null
    userErrors: Array<{
      field: string[] | null
      message: string
    }>
  }
}

function normalizeOrderId(orderId: string) {
  return orderId.split('?')[0]
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get(
      'customer-access-token'
    )?.value

    if (!customerAccessToken) {
      return Response.json(
        {error: {message: 'Nu ești autentificat.'}},
        {status: 401}
      )
    }

    const body: unknown = await req.json()
    const orderId =
      typeof body === 'object' &&
      body !== null &&
      'orderId' in body &&
      typeof body.orderId === 'string'
        ? body.orderId
        : null

    if (!orderId) {
      return Response.json(
        {error: {message: 'ID-ul comenzii este obligatoriu.'}},
        {status: 400}
      )
    }

    const customerResponse =
      await shopifyStorefrontRequest<CustomerOrdersData>(
        CUSTOMER_ORDERS_QUERY,
        {customerAccessToken, first: 100},
        customerAccessToken
      )

    if (customerResponse.errors?.length) {
      throw new Error(customerResponse.errors[0]?.message)
    }

    const customer = customerResponse.data?.customer
    if (!customer) {
      return Response.json(
        {error: {message: 'Sesiunea clientului nu mai este validă.'}},
        {status: 401}
      )
    }

    const normalizedRequestedId = normalizeOrderId(orderId)
    const ownedOrder = customer.orders.edges
      .map(({node}) => node)
      .find(({id}) => normalizeOrderId(id) === normalizedRequestedId)

    if (!ownedOrder) {
      return Response.json(
        {error: {message: 'Comanda nu a fost găsită.'}},
        {status: 404}
      )
    }

    const updateResponse = await shopifyAdminRequest<TagsAddData>(
      TAGS_ADD_MUTATION,
      {
        id: normalizedRequestedId,
        tags: ['Cancellation Requested'],
      }
    )

    if (updateResponse.errors?.length) {
      throw new Error(updateResponse.errors[0]?.message)
    }

    const userErrors = updateResponse.data?.tagsAdd.userErrors ?? []
    if (userErrors.length > 0) {
      throw new Error(userErrors[0].message)
    }

    return Response.json({
      success: true,
      message: `Cererea pentru ${ownedOrder.name} a fost înregistrată.`,
    })
  } catch (error: unknown) {
    serverLogger.error('account.order.cancellation.failed', error)
    return Response.json(
      {error: {message: 'Cererea de anulare nu a putut fi procesată.'}},
      {status: 500}
    )
  }
}
