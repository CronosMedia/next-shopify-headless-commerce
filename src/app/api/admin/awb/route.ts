import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { shopifyAdminRequest } from '@/lib/shopify/admin.server'

const GET_ORDER_AWB_DETAILS = `#graphql
  query GetOrderAwbDetails($id: ID!) {
    order(id: $id) {
      id
      name
      awbCode: metafield(namespace: "custom", key: "awb_code") {
        value
      }
      awbProvider: metafield(namespace: "custom", key: "awb_provider") {
        value
      }
      awbStatus: metafield(namespace: "custom", key: "awb_status") {
        value
      }
      awbTrackingUrl: metafield(namespace: "custom", key: "awb_tracking_url") {
        value
      }
      awbIssuedAt: metafield(namespace: "custom", key: "awb_issued_at") {
        value
      }
      courierName: metafield(namespace: "custom", key: "courier_name") {
        value
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

type OrderAwbDetailsResponse = {
  order: {
    id: string
    name: string
    awbCode: { value: string } | null
    awbProvider: { value: string } | null
    awbStatus: { value: string } | null
    awbTrackingUrl: { value: string } | null
    awbIssuedAt: { value: string } | null
    courierName: { value: string } | null
  } | null
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

type AwbMode = 'demo' | 'real'

function getAwbProvider() {
  return process.env.AWB_PROVIDER?.trim().toLowerCase() || 'demo'
}

function getAwbMode(provider: string): AwbMode {
  return provider === 'demo' ? 'demo' : 'real'
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

    const provider = getAwbProvider()
    const mode = getAwbMode(provider)

    const orderResponse = await shopifyAdminRequest<OrderAwbDetailsResponse>(
      GET_ORDER_AWB_DETAILS,
      { id: orderId }
    )

    if (orderResponse.errors?.length || !orderResponse.data?.order) {
      return NextResponse.json(
        {
          success: false,
          mode,
          fulfilled: false,
          error: orderResponse.errors?.[0]?.message || 'Order not found.',
        },
        { status: 404 }
      )
    }

    const order = orderResponse.data.order

    if (order.awbCode?.value) {
      const existingProvider = order.awbProvider?.value || 'demo'

      return NextResponse.json({
        success: true,
        alreadyIssued: true,
        mode: getAwbMode(existingProvider),
        fulfilled: false,
        message: 'AWB-ul era deja generat. Comanda nu a fost marcată ca expediată.',
        awb: {
          status: getAwbMode(existingProvider) === 'demo' ? 'simulated' : 'issued',
          provider: existingProvider,
          code: order.awbCode.value,
          trackingUrl: order.awbTrackingUrl?.value,
          issuedAt: order.awbIssuedAt?.value,
        },
      })
    }

    if (mode === 'real') {
      return NextResponse.json(
        {
          success: false,
          mode,
          fulfilled: false,
          error: `Providerul AWB "${provider}" nu este configurat complet în acest batch.`,
          awb: {
            status: 'error',
            provider,
          },
        },
        { status: 501 }
      )
    }

    const awbCode = `AWB${Math.floor(10000000 + Math.random() * 90000000)}`
    const courier = 'Sameday Demo'
    const trackingUrl = `https://sameday.ro/tracking/?awb=${awbCode}`
    const issuedAt = new Date().toISOString()

    const metafields = [
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'awb_code',
        value: awbCode,
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'awb_provider',
        value: provider,
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'awb_status',
        value: 'simulated',
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'courier_name',
        value: courier,
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'awb_tracking_url',
        value: trackingUrl,
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'awb_issued_at',
        value: issuedAt,
        type: 'single_line_text_field',
      },
    ]

    const metafieldResponse = await shopifyAdminRequest<MetafieldMutationResponse>(
      SET_ORDER_METAFIELDS,
      { metafields }
    )

    const metafieldErrors = metafieldResponse.data?.metafieldsSet.userErrors || []

    if (metafieldResponse.errors?.length || metafieldErrors.length) {
      return NextResponse.json(
        {
          success: false,
          mode,
          fulfilled: false,
          error:
            metafieldResponse.errors?.[0]?.message ||
            metafieldErrors[0]?.message ||
            'AWB-ul demo nu a putut fi salvat pe comandă.',
          awb: {
            status: 'error',
            provider,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alreadyIssued: false,
      mode,
      fulfilled: false,
      message: 'AWB demo generat. Comanda nu a fost marcată ca expediată.',
      awb: {
        status: 'simulated',
        provider,
        code: awbCode,
        trackingUrl,
        issuedAt,
      },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        mode: 'demo',
        fulfilled: false,
        error: 'A apărut o eroare la generarea AWB-ului.',
      },
      { status: 500 }
    )
  }
}
