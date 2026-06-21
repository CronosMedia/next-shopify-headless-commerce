import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { shopifyAdminRequest } from '@/lib/shopify/admin.server'
import { getInvoicingService } from '@/lib/invoicing'
import type { InvoiceData, InvoiceLineItem, CompanyData } from '@/lib/invoicing-types'

const GET_ORDER_DETAILS_FOR_INVOICE = `#graphql
  query GetOrderForInvoice($id: ID!) {
    order(id: $id) {
      id
      name
      processedAt
      displayFinancialStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customAttributes {
        key
        value
      }
      customer {
        firstName
        lastName
        email
        phone
      }
      billingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      shippingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      lineItems(first: 50) {
        edges {
          node {
            id
            title
            quantity
            sku
            variant {
              price
            }
            taxLines {
              rate
              title
            }
          }
        }
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

type TaxLine = {
  rate: number
  title: string
}

type AdminOrderLineItemNode = {
  id: string
  title: string
  quantity: number
  sku: string | null
  variant: {
    price: string
  } | null
  taxLines: TaxLine[]
}

type AdminOrderDetailsResponse = {
  order: {
    id: string
    name: string
    processedAt: string
    displayFinancialStatus: string
    totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
    subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
    totalTaxSet: { shopMoney: { amount: string; currencyCode: string } }
    customAttributes: Array<{ key: string; value: string }>
    customer: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
    } | null
    billingAddress: {
      firstName: string
      lastName: string
      company: string | null
      address1: string
      address2: string | null
      city: string
      province: string
      zip: string
      country: string
      phone: string | null
    } | null
    shippingAddress: {
      firstName: string
      lastName: string
      company: string | null
      address1: string
      address2: string | null
      city: string
      province: string
      zip: string
      country: string
      phone: string | null
    } | null
    lineItems: {
      edges: Array<{
        node: AdminOrderLineItemNode
      }>
    }
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

    // 1. Fetch order details from Shopify Admin API
    const orderResponse = await shopifyAdminRequest<AdminOrderDetailsResponse>(
      GET_ORDER_DETAILS_FOR_INVOICE,
      { id: orderId }
    )

    if (orderResponse.errors?.length || !orderResponse.data?.order) {
      return NextResponse.json(
        { error: orderResponse.errors?.[0]?.message || 'Order not found.' },
        { status: 404 }
      )
    }

    const order = orderResponse.data.order

    // Helper to read order attributes
    const getAttr = (key: string) => order.customAttributes?.find((a) => a.key === key)?.value || ''
    const isFirm = getAttr('Facturare pe firmă') === 'Da'

    // 2. Map Client Data (CompanyData interface)
    let client: CompanyData

    if (isFirm) {
      client = {
        cui: getAttr('Cod Unic de Înregistrare (CUI)').replace(/^RO\s*/i, '').trim(),
        denumire: getAttr('Denumire Firmă'),
        nrRegCom: getAttr('Număr Registrul Comerțului') || undefined,
        adresa: getAttr('Adresă Facturare').split(',')[0]?.trim() || order.billingAddress?.address1 || '',
        judet: getAttr('Adresă Facturare').split(',')[2]?.trim() || order.billingAddress?.province || '',
        localitate: getAttr('Adresă Facturare').split(',')[1]?.trim() || order.billingAddress?.city || '',
        codPostal: getAttr('Adresă Facturare').match(/Postal:\s*(\d+)/)?.[1] || order.billingAddress?.zip || '',
        telefon: getAttr('Adresă Facturare').match(/Tel:\s*([0-9+\s]+)/)?.[1] || order.billingAddress?.phone || order.customer?.phone || '',
        email: order.customer?.email || '',
        platitorTva: getAttr('TVA') === 'Da',
      }
    } else {
      // Persoană Fizică (Custom or same as shipping)
      const name = getAttr('Nume Facturare') || `${order.billingAddress?.firstName || order.customer?.firstName || ''} ${order.billingAddress?.lastName || order.customer?.lastName || ''}`.trim()
      const adresaCompletat = getAttr('Adresă Facturare')
      
      client = {
        cui: '',
        denumire: name || 'Client Fizic',
        adresa: adresaCompletat ? adresaCompletat.split(',')[0]?.trim() : (order.billingAddress?.address1 || order.shippingAddress?.address1 || ''),
        judet: adresaCompletat ? adresaCompletat.split(',')[2]?.trim() : (order.billingAddress?.province || order.shippingAddress?.province || ''),
        localitate: adresaCompletat ? adresaCompletat.split(',')[1]?.trim() : (order.billingAddress?.city || order.shippingAddress?.city || ''),
        codPostal: (adresaCompletat && adresaCompletat.match(/Postal:\s*(\d+)/)?.[1]) || order.billingAddress?.zip || order.shippingAddress?.zip || '',
        telefon: (adresaCompletat && adresaCompletat.match(/Tel:\s*([0-9+\s]+)/)?.[1]) || order.billingAddress?.phone || order.customer?.phone || '',
        email: order.customer?.email || '',
        platitorTva: false,
      }
    }

    // 3. Map line items
    const items: InvoiceLineItem[] = order.lineItems.edges.map(({ node }) => {
      const taxLine = node.taxLines?.[0]
      const taxRate = taxLine ? taxLine.rate : 0.19 // Default 19% Romanian VAT
      const vatRate = taxRate * 100

      const unitPriceWithVat = parseFloat(node.variant?.price || '0')
      const unitPriceWithoutVat = unitPriceWithVat / (1 + taxRate)
      const totalWithoutVat = unitPriceWithoutVat * node.quantity
      const totalWithVat = unitPriceWithVat * node.quantity
      const vatValue = totalWithVat - totalWithoutVat

      return {
        name: node.title,
        code: node.sku || undefined,
        um: 'buc',
        quantity: node.quantity,
        price: parseFloat(unitPriceWithoutVat.toFixed(4)),
        priceWithVat: parseFloat(unitPriceWithVat.toFixed(2)),
        vatRate,
        vatValue: parseFloat(vatValue.toFixed(2)),
        total: parseFloat(totalWithoutVat.toFixed(2)),
        totalWithVat: parseFloat(totalWithVat.toFixed(2)),
      }
    })

    // 4. Invoicing InvoiceData object
    const invoiceData: InvoiceData = {
      orderId: order.id.split('/').pop() || '',
      date: new Date().toISOString().split('T')[0],
      type: 'invoice',
      currency: order.totalPriceSet.shopMoney.currencyCode,
      client,
      items,
      subtotal: parseFloat((parseFloat(order.totalPriceSet.shopMoney.amount) - parseFloat(order.totalTaxSet.shopMoney.amount)).toFixed(2)),
      totalVat: parseFloat(parseFloat(order.totalTaxSet.shopMoney.amount).toFixed(2)),
      total: parseFloat(parseFloat(order.totalPriceSet.shopMoney.amount).toFixed(2)),
      paymentMethod: order.totalPriceSet.shopMoney.amount === '0.00' ? 'Free' : 'Card',
      isPaid: order.displayFinancialStatus === 'PAID',
      paidDate: order.displayFinancialStatus === 'PAID' ? new Date().toISOString().split('T')[0] : undefined,
    }

    // 5. Generate the invoice via service
    const invoiceService = getInvoicingService()
    const invoiceResult = await invoiceService.issueInvoice(invoiceData)

    if (!invoiceResult.success || !invoiceResult.url) {
      return NextResponse.json(
        { error: invoiceResult.error || 'Generarea facturii a eșuat.' },
        { status: 500 }
      )
    }

    // 6. Save PDF URL & details back to Shopify Order Metafields
    const metafields = [
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'invoice_pdf_url',
        value: invoiceResult.url,
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'invoice_number',
        value: `${invoiceResult.series} ${invoiceResult.number}`.trim(),
        type: 'single_line_text_field',
      },
      {
        ownerId: order.id,
        namespace: 'custom',
        key: 'invoice_provider',
        value: invoiceResult.provider,
        type: 'single_line_text_field',
      },
    ]

    await shopifyAdminRequest<MetafieldMutationResponse>(
      SET_ORDER_METAFIELDS,
      { metafields }
    )

    return NextResponse.json({
      success: true,
      invoice: {
        number: `${invoiceResult.series} ${invoiceResult.number}`.trim(),
        url: invoiceResult.url,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'A apărut o eroare la emiterea facturii.' },
      { status: 500 }
    )
  }
}
