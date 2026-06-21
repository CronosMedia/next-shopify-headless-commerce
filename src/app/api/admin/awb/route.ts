import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { shopifyAdminRequest } from '@/lib/shopify/admin.server'

const GET_FULFILLMENT_ORDERS = `#graphql
  query GetFulfillmentOrders($id: ID!) {
    order(id: $id) {
      id
      name
      fulfillmentOrders(first: 5, displayable: true) {
        edges {
          node {
            id
            status
            supportedActions
          }
        }
      }
    }
  }
`

const CREATE_FULFILLMENT = `#graphql
  mutation FulfillmentCreate($fulfillment: FulfillmentV2Input!) {
    fulfillmentCreateV2(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`

const SET_ORDER_METAFIELDS = `#graphql
  mutation SetOrderMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`

type FulfillmentOrderNode = {
  id: string
  status: string
  supportedActions: string[]
}

type FulfillmentOrdersResponse = {
  order: {
    id: string
    name: string
    fulfillmentOrders: {
      edges: Array<{
        node: FulfillmentOrderNode
      }>
    }
  } | null
}

type FulfillmentMutationResponse = {
  fulfillmentCreateV2: {
    fulfillment: {
      id: string
      status: string
    } | null
    userErrors: Array<{
      field: string[]
      message: string
    }>
  }
}

type MetafieldMutationResponse = {
  metafieldsSet: {
    metafields: Array<{
      id: string
      namespace: string
      key: string
      value: string
    }> | null
    userErrors: Array<{
      field: string[]
      message: string
    }>
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdminSession()

    if (!adminSession.authenticated) {
      return adminSession.response
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is missing.' },
        { status: 400 }
      )
    }

    // 1. Generate AWB number
    const awbCode = `AWB${Math.floor(10000000 + Math.random() * 90000000)}`
    const courier = 'Sameday'
    const trackingUrl = `https://sameday.ro/tracking/?awb=${awbCode}`

    // 2. Fetch fulfillment orders for the order
    const foResponse = await shopifyAdminRequest<FulfillmentOrdersResponse>(
      GET_FULFILLMENT_ORDERS,
      { id: orderId }
    )

    if (foResponse.errors?.length || !foResponse.data?.order) {
      return NextResponse.json(
        { error: foResponse.errors?.[0]?.message || 'Order not found.' },
        { status: 404 }
      )
    }

    const order = foResponse.data.order
    const fulfillmentOrders = order.fulfillmentOrders.edges.map(({ node }) => node)
    const openFo = fulfillmentOrders.find(
      (fo) => fo.status === 'OPEN' || fo.status === 'IN_PROGRESS'
    )

    // 3. Set custom AWB metafields in Shopify
    const metafields = [
      {
        ownerId: orderId,
        namespace: 'custom',
        key: 'awb_code',
        value: awbCode,
        type: 'single_line_text_field',
      },
      {
        ownerId: orderId,
        namespace: 'custom',
        key: 'courier_name',
        value: courier,
        type: 'single_line_text_field',
      },
    ]

    await shopifyAdminRequest<MetafieldMutationResponse>(
      SET_ORDER_METAFIELDS,
      { metafields }
    )

    // 4. Create the Shopify fulfillment (mark as fulfilled in Shopify) if there's an open fulfillment order
    if (openFo) {
      const fulfillmentInput = {
        lineItemsByFulfillmentOrder: [
          {
            fulfillmentOrderId: openFo.id,
          },
        ],
        trackingInfo: {
          number: awbCode,
          url: trackingUrl,
          company: courier,
        },
      }

      await shopifyAdminRequest<FulfillmentMutationResponse>(
        CREATE_FULFILLMENT,
        { fulfillment: fulfillmentInput }
      )
    }

    return NextResponse.json({
      success: true,
      awb: {
        code: awbCode,
        courier,
        trackingUrl,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'A apărut o eroare la generarea AWB-ului.' },
      { status: 500 }
    )
  }
}
