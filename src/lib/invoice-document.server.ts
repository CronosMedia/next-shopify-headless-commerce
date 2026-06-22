import 'server-only'

import {getAdminSession, isValidAdminSession} from '@/lib/admin-session'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {formatMoney} from '@/lib/utils'

const GET_ORDER_FOR_DEMO_INVOICE = `#graphql
  query GetOrderForDemoInvoice($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      processedAt
      displayFinancialStatus
      displayFulfillmentStatus
      currencyCode
      customer {
        displayName
        email
      }
      billingAddress {
        name
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
        name
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
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
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 100) {
        nodes {
          title
          quantity
          sku
          variantTitle
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          discountedTotalSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
      customAttributes {
        key
        value
      }
      invoiceProvider: metafield(namespace: "custom", key: "invoice_provider") {
        value
      }
      invoiceStatus: metafield(namespace: "custom", key: "invoice_status") {
        value
      }
      invoiceNumber: metafield(namespace: "custom", key: "invoice_number") {
        value
      }
      invoiceSeries: metafield(namespace: "custom", key: "invoice_series") {
        value
      }
      invoiceIssuedAt: metafield(namespace: "custom", key: "invoice_issued_at") {
        value
      }
    }
  }
`

export type InvoiceSearchParams = Record<string, string | string[] | undefined>

type Money = {
  amount: string
  currencyCode: string
}

type MailingAddress = {
  name: string | null
  company: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  zip: string | null
  country: string | null
  phone: string | null
}

type ShopifyLineItem = {
  title: string
  quantity: number
  sku: string | null
  variantTitle: string | null
  originalUnitPriceSet: {
    shopMoney: Money
  }
  discountedTotalSet: {
    shopMoney: Money
  }
}

type ShopifyOrder = {
  id: string
  legacyResourceId: string
  name: string
  createdAt: string
  processedAt: string | null
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  currencyCode: string
  customer: {
    displayName: string
    email: string | null
  } | null
  billingAddress: MailingAddress | null
  shippingAddress: MailingAddress | null
  subtotalPriceSet: {shopMoney: Money}
  totalShippingPriceSet: {shopMoney: Money}
  totalTaxSet: {shopMoney: Money}
  totalPriceSet: {shopMoney: Money}
  lineItems: {
    nodes: ShopifyLineItem[]
  }
  customAttributes: Array<{key: string; value: string}>
  invoiceProvider: {value: string} | null
  invoiceStatus: {value: string} | null
  invoiceNumber: {value: string} | null
  invoiceSeries: {value: string} | null
  invoiceIssuedAt: {value: string} | null
}

type ShopifyOrderResponse = {
  order: ShopifyOrder | null
}

type NormalizedOrderId =
  | {
      kind: 'demo'
    }
  | {
      kind: 'real'
      gid: string
    }
  | {
      kind: 'invalid'
      message: string
    }

export type InvoiceLine = {
  title: string
  detail: string
  quantity: string
  unitPrice: string
  total: string
}

export type InvoiceDocumentData = {
  invoiceIdentifier: string
  printDocumentTitle: string
  issuedAt: string
  issuerName: string
  issuerNote: string
  customerName: string
  customerLines: string[]
  orderName: string
  orderStatus: string
  currency: string
  orderDate: string
  lines: InvoiceLine[]
  subtotal: string
  shipping: string
  tax: string
  total: string
}

export type LoadInvoiceDocumentResult =
  | {
      status: 'ok'
      data: InvoiceDocumentData
    }
  | {
      status: 'unauthorized'
    }
  | {
      status: 'error'
      message: string
    }

function getSearchValue(searchParams: InvoiceSearchParams, key: string) {
  const value = searchParams[key]
  const rawValue = Array.isArray(value) ? value[0] : value
  return rawValue?.trim() || ''
}

function formatDisplayDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return value || 'Indisponibil'
  }

  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatFilenameDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0]
  }

  return date.toISOString().split('T')[0]
}

function slugifyFilenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildInvoiceFilename({
  clientName,
  invoiceIdentifier,
  issuedAt,
  orderName,
}: {
  clientName: string
  invoiceIdentifier: string
  issuedAt: string
  orderName: string
}) {
  const safeInvoiceIdentifier = slugifyFilenamePart(invoiceIdentifier)
  const safeClientName = slugifyFilenamePart(clientName)
  const safeOrderName = slugifyFilenamePart(orderName.replace(/^#/, 'comanda-'))
  const safeDate = slugifyFilenamePart(issuedAt)
  const subject =
    safeClientName && safeClientName !== 'client-indisponibil'
      ? safeClientName
      : safeOrderName

  return compactLines([
    'factura-demo',
    safeInvoiceIdentifier,
    subject,
    safeDate,
  ]).join('-')
}

function normalizeOrderId(rawId: string): NormalizedOrderId {
  let decodedId = rawId.trim()

  try {
    decodedId = decodeURIComponent(rawId).trim()
  } catch {
    return {
      kind: 'invalid',
      message: 'Formatul ID-ului de comandă nu este valid pentru documentul demo.',
    }
  }

  if (!decodedId || decodedId === 'demo-order' || decodedId.startsWith('demo')) {
    return {kind: 'demo'}
  }

  if (/^\d+$/.test(decodedId)) {
    return {
      kind: 'real',
      gid: `gid://shopify/Order/${decodedId}`,
    }
  }

  if (decodedId.startsWith('gid://shopify/Order/')) {
    return {
      kind: 'real',
      gid: decodedId,
    }
  }

  return {
    kind: 'invalid',
    message: 'Formatul ID-ului de comandă nu este valid pentru documentul demo.',
  }
}

function splitInvoiceNumber(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return {
      series: '',
      number: parts[0] || '',
    }
  }

  const [series, ...numberParts] = parts

  return {
    series: series || '',
    number: numberParts.join(' '),
  }
}

function getInvoiceIdentifier(
  searchParams: InvoiceSearchParams,
  order?: ShopifyOrder
) {
  const querySeries = getSearchValue(searchParams, 'series')
  const queryNumber = getSearchValue(searchParams, 'number')
  const metafieldSeries = order?.invoiceSeries?.value || ''
  const metafieldNumber = order?.invoiceNumber?.value || ''
  const splitNumber = splitInvoiceNumber(metafieldNumber)
  const series = querySeries || metafieldSeries || splitNumber.series || 'DEMO'
  const number = queryNumber || splitNumber.number || metafieldNumber

  return [series, number].filter(Boolean).join(' ')
}

function getAttribute(order: ShopifyOrder, key: string) {
  return (
    order.customAttributes.find((attribute) => attribute.key === key)?.value || ''
  )
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line))
}

function formatAddress(address: MailingAddress | null) {
  if (!address) return []

  return compactLines([
    address.company,
    [address.address1, address.address2].filter(Boolean).join(', '),
    [address.city, address.province, address.zip].filter(Boolean).join(', '),
    address.country,
    address.phone ? `Tel: ${address.phone}` : '',
  ])
}

function getCustomerDetails(order: ShopifyOrder) {
  const isCompanyInvoice = getAttribute(order, 'Facturare pe firmă') === 'Da'

  if (isCompanyInvoice) {
    const companyName = getAttribute(order, 'Denumire Firmă')
    const cui = getAttribute(order, 'Cod Unic de Înregistrare (CUI)')
    const registry = getAttribute(order, 'Număr Registrul Comerțului')
    const vat = getAttribute(order, 'TVA')
    const invoiceAddress = getAttribute(order, 'Adresă Facturare')

    return {
      name:
        companyName ||
        order.billingAddress?.company ||
        order.customer?.displayName ||
        'Client indisponibil',
      lines: compactLines([
        cui ? `CUI: ${cui}` : '',
        registry ? `Reg. Com.: ${registry}` : '',
        vat ? `TVA: ${vat}` : '',
        invoiceAddress,
        order.customer?.email ? `Email: ${order.customer.email}` : '',
      ]),
    }
  }

  const billingLines = formatAddress(order.billingAddress)

  return {
    name:
      order.billingAddress?.name ||
      order.customer?.displayName ||
      'Client indisponibil',
    lines: compactLines([
      ...billingLines,
      order.customer?.email ? `Email: ${order.customer.email}` : '',
    ]),
  }
}

function mapOrderToDocumentData(
  order: ShopifyOrder,
  searchParams: InvoiceSearchParams
): InvoiceDocumentData {
  const customer = getCustomerDetails(order)
  const currency =
    order.currencyCode || order.totalPriceSet.shopMoney.currencyCode || 'RON'
  const invoiceIdentifier = getInvoiceIdentifier(searchParams, order)
  const issuedAt = formatDisplayDate(order.invoiceIssuedAt?.value)
  const filenameDate = formatFilenameDate(order.invoiceIssuedAt?.value)
  const orderName = order.name || order.legacyResourceId

  return {
    invoiceIdentifier,
    printDocumentTitle: buildInvoiceFilename({
      clientName: customer.name,
      invoiceIdentifier,
      issuedAt: filenameDate,
      orderName,
    }),
    issuedAt,
    issuerName: 'Maison Outdoor',
    issuerNote:
      'Furnizor demo pentru fluxul de simulare. Date fiscale reale indisponibile în documentul demo.',
    customerName: customer.name,
    customerLines: customer.lines,
    orderName,
    orderStatus: `${order.displayFinancialStatus} / ${order.displayFulfillmentStatus}`,
    currency,
    orderDate: formatDisplayDate(order.processedAt || order.createdAt),
    lines: order.lineItems.nodes.map((item) => ({
      title: item.title,
      detail: compactLines([
        item.variantTitle,
        item.sku ? `SKU: ${item.sku}` : '',
      ]).join(' / '),
      quantity: String(item.quantity),
      unitPrice: formatMoney(
        item.originalUnitPriceSet.shopMoney.amount,
        item.originalUnitPriceSet.shopMoney.currencyCode
      ),
      total: formatMoney(
        item.discountedTotalSet.shopMoney.amount,
        item.discountedTotalSet.shopMoney.currencyCode
      ),
    })),
    subtotal: formatMoney(
      order.subtotalPriceSet.shopMoney.amount,
      order.subtotalPriceSet.shopMoney.currencyCode
    ),
    shipping: formatMoney(
      order.totalShippingPriceSet.shopMoney.amount,
      order.totalShippingPriceSet.shopMoney.currencyCode
    ),
    tax: formatMoney(
      order.totalTaxSet.shopMoney.amount,
      order.totalTaxSet.shopMoney.currencyCode
    ),
    total: formatMoney(
      order.totalPriceSet.shopMoney.amount,
      order.totalPriceSet.shopMoney.currencyCode
    ),
  }
}

function mapDemoToDocumentData(
  id: string,
  searchParams: InvoiceSearchParams
): InvoiceDocumentData {
  const products = getSearchValue(searchParams, 'products')
    .split('|')
    .map((product) => product.trim())
    .filter(Boolean)
  const currency = getSearchValue(searchParams, 'currency') || 'RON'
  const issuedAtSource =
    getSearchValue(searchParams, 'issuedAt') || getSearchValue(searchParams, 'date')
  const invoiceIdentifier = getInvoiceIdentifier(searchParams)
  const issuedAt = formatDisplayDate(issuedAtSource)
  const filenameDate = formatFilenameDate(issuedAtSource)
  const customerName = getSearchValue(searchParams, 'customer') || 'Client indisponibil'
  const orderName = getSearchValue(searchParams, 'orderName') || id || 'demo-order'

  return {
    invoiceIdentifier,
    printDocumentTitle: buildInvoiceFilename({
      clientName: customerName,
      invoiceIdentifier,
      issuedAt: filenameDate,
      orderName,
    }),
    issuedAt,
    issuerName: 'Maison Outdoor',
    issuerNote:
      'Furnizor demo pentru fluxul de simulare. Date fiscale reale indisponibile în documentul demo.',
    customerName,
    customerLines: ['Date client indisponibile sau limitate pentru documentul demo.'],
    orderName,
    orderStatus: getSearchValue(searchParams, 'status') || 'Demo / simulare',
    currency,
    orderDate: 'Indisponibil',
    lines: products.map((product) => ({
      title: product,
      detail: '',
      quantity: '-',
      unitPrice: '-',
      total: '-',
    })),
    subtotal: getSearchValue(searchParams, 'subtotal'),
    shipping: getSearchValue(searchParams, 'shipping'),
    tax: getSearchValue(searchParams, 'tax'),
    total: getSearchValue(searchParams, 'total') || 'Indisponibil',
  }
}

async function fetchOrderDocumentData(
  gid: string,
  searchParams: InvoiceSearchParams
) {
  try {
    const response = await shopifyAdminRequest<ShopifyOrderResponse>(
      GET_ORDER_FOR_DEMO_INVOICE,
      {id: gid}
    )

    if (response.errors?.length) {
      return {
        error: response.errors[0].message,
      }
    }

    if (!response.data?.order) {
      return {
        error: 'Comanda nu a fost găsită.',
      }
    }

    return {
      data: mapOrderToDocumentData(response.data.order, searchParams),
    }
  } catch {
    return {
      error: 'Comanda nu poate fi încărcată din Shopify Admin.',
    }
  }
}

export async function loadInvoiceDocument(
  rawId: string,
  searchParams: InvoiceSearchParams
): Promise<LoadInvoiceDocumentResult> {
  const normalizedId = normalizeOrderId(rawId)

  if (normalizedId.kind === 'invalid') {
    return {
      status: 'error',
      message: normalizedId.message,
    }
  }

  if (normalizedId.kind === 'demo') {
    return {
      status: 'ok',
      data: mapDemoToDocumentData(rawId, searchParams),
    }
  }

  const session = await getAdminSession()

  if (!isValidAdminSession(session)) {
    return {
      status: 'unauthorized',
    }
  }

  const result = await fetchOrderDocumentData(normalizedId.gid, searchParams)

  if (result.error || !result.data) {
    return {
      status: 'error',
      message: result.error || 'Comanda nu poate fi încărcată.',
    }
  }

  return {
    status: 'ok',
    data: result.data,
  }
}
