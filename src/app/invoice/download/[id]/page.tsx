import Link from 'next/link'
import {getAdminSession, isValidAdminSession} from '@/lib/admin-session'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {formatMoney} from '@/lib/utils'
import {PrintButton} from './PrintButton'

export const dynamic = 'force-dynamic'

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

type SearchParams = Record<string, string | string[] | undefined>

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<SearchParams>
}

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

type InvoiceLine = {
  title: string
  detail: string
  quantity: string
  unitPrice: string
  total: string
}

type DocumentData = {
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

function getSearchValue(searchParams: SearchParams, key: string) {
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

function buildInvoiceFilename({
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
  const subject = safeClientName && safeClientName !== 'client-indisponibil'
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

function getInvoiceIdentifier(searchParams: SearchParams, order?: ShopifyOrder) {
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
  return order.customAttributes.find((attribute) => attribute.key === key)?.value || ''
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines.map((line) => line?.trim()).filter((line): line is string => Boolean(line))
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
      name: companyName || order.billingAddress?.company || order.customer?.displayName || 'Client indisponibil',
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

function mapOrderToDocumentData(order: ShopifyOrder, searchParams: SearchParams): DocumentData {
  const customer = getCustomerDetails(order)
  const currency = order.currencyCode || order.totalPriceSet.shopMoney.currencyCode || 'RON'
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
    issuerNote: 'Furnizor demo pentru fluxul de simulare. Date fiscale reale indisponibile în documentul demo.',
    customerName: customer.name,
    customerLines: customer.lines,
    orderName,
    orderStatus: `${order.displayFinancialStatus} / ${order.displayFulfillmentStatus}`,
    currency,
    orderDate: formatDisplayDate(order.processedAt || order.createdAt),
    lines: order.lineItems.nodes.map((item) => ({
      title: item.title,
      detail: compactLines([item.variantTitle, item.sku ? `SKU: ${item.sku}` : '']).join(' / '),
      quantity: String(item.quantity),
      unitPrice: formatMoney(item.originalUnitPriceSet.shopMoney.amount, item.originalUnitPriceSet.shopMoney.currencyCode),
      total: formatMoney(item.discountedTotalSet.shopMoney.amount, item.discountedTotalSet.shopMoney.currencyCode),
    })),
    subtotal: formatMoney(order.subtotalPriceSet.shopMoney.amount, order.subtotalPriceSet.shopMoney.currencyCode),
    shipping: formatMoney(order.totalShippingPriceSet.shopMoney.amount, order.totalShippingPriceSet.shopMoney.currencyCode),
    tax: formatMoney(order.totalTaxSet.shopMoney.amount, order.totalTaxSet.shopMoney.currencyCode),
    total: formatMoney(order.totalPriceSet.shopMoney.amount, order.totalPriceSet.shopMoney.currencyCode),
  }
}

function mapDemoToDocumentData(id: string, searchParams: SearchParams): DocumentData {
  const products = getSearchValue(searchParams, 'products')
    .split('|')
    .map((product) => product.trim())
    .filter(Boolean)
  const currency = getSearchValue(searchParams, 'currency') || 'RON'
  const issuedAtSource = getSearchValue(searchParams, 'issuedAt') || getSearchValue(searchParams, 'date')
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
    issuerNote: 'Furnizor demo pentru fluxul de simulare. Date fiscale reale indisponibile în documentul demo.',
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

async function fetchOrderDocumentData(gid: string, searchParams: SearchParams) {
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

function UnauthorizedState() {
  return (
    <main className="min-h-screen bg-[#eef0f2] px-4 py-10 text-[#1f2933] [font-family:var(--font-geist),Arial,sans-serif]">
      <section className="mx-auto max-w-lg border border-[#d8dde3] bg-white p-8">
        <p className="text-[11px] font-bold uppercase text-[#64748b]">401</p>
        <h1 className="mt-2 text-2xl font-bold text-[#111827]">
          Acces neautorizat
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">
          Datele reale ale comenzii sunt disponibile doar cu o sesiune admin
          validă.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#202223] px-4 text-sm font-semibold text-white"
        >
          Mergi la admin
        </Link>
      </section>
    </main>
  )
}

function ErrorState({message}: {message: string}) {
  return (
    <main className="min-h-screen bg-[#eef0f2] px-4 py-10 text-[#1f2933] [font-family:var(--font-geist),Arial,sans-serif]">
      <section className="mx-auto max-w-lg border border-[#d8dde3] bg-white p-8">
        <p className="text-[11px] font-bold uppercase text-[#64748b]">
          Document indisponibil
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#111827]">
          Nu am putut încărca factura demo
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">{message}</p>
        <Link
          href="/admin/orders"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-[#c8ccd0] bg-white px-4 text-sm font-semibold text-[#374151]"
        >
          Înapoi la admin
        </Link>
      </section>
    </main>
  )
}

function InvoiceDocument({documentData}: {documentData: DocumentData}) {
  return (
    <main className="min-h-screen bg-[#eef0f2] px-4 py-6 text-[#1f2933] [font-family:var(--font-geist),Arial,sans-serif] print:bg-white print:px-0 print:py-0">
      <div className="mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8ccd0] bg-white px-4 text-sm font-semibold text-[#374151] transition hover:bg-[#f7f8f9]"
        >
          Înapoi la admin
        </Link>
        <div className="flex flex-col items-end gap-1 text-right">
          <PrintButton documentTitle={documentData.printDocumentTitle} />
          <p className="max-w-xs text-xs leading-5 text-[#64748b]">
            Pentru PDF curat, debifează „Headers and footers” în dialogul de
            print.
          </p>
        </div>
      </div>

      <section className="mx-auto min-h-[297mm] w-full max-w-[210mm] border border-[#d8dde3] bg-white px-7 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:px-10 sm:py-11 print:min-h-0 print:max-w-none print:border-0 print:px-0 print:py-0 print:shadow-none">
        <header className="flex flex-col gap-8 border-b border-[#d7dce2] pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              {documentData.issuerName}
            </p>
            <p className="mt-2 inline-flex rounded-full border border-[#d8dde3] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#475569]">
              Document de simulare
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#64748b]">
              Document intern generat pentru demonstrarea fluxului de facturare.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="text-3xl font-bold uppercase tracking-[0.08em] text-[#111827]">
              FACTURĂ DEMO
            </h1>
            <p className="mt-3 text-sm font-semibold text-[#374151]">
              {documentData.invoiceIdentifier}
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              Data emiterii: {documentData.issuedAt}
            </p>
          </div>
        </header>

        <div className="mt-7 border border-[#f0d7a7] bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-[#6b4e16]">
          Acest document este generat pentru demonstrație și nu reprezintă
          factură fiscală reală.
        </div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="border border-[#e2e8f0] p-5">
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Furnizor
            </p>
            <p className="mt-3 text-base font-bold text-[#111827]">
              {documentData.issuerName}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              {documentData.issuerNote}
            </p>
          </div>

          <div className="border border-[#e2e8f0] p-5">
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Client
            </p>
            <p className="mt-3 text-base font-bold text-[#111827]">
              {documentData.customerName}
            </p>
            {documentData.customerLines.length > 0 ? (
              <div className="mt-2 space-y-1 text-sm leading-6 text-[#64748b]">
                {documentData.customerLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                Date client indisponibile sau limitate pentru documentul demo.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-3 border-y border-[#e2e8f0] py-5 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Comandă
            </p>
            <p className="mt-1 font-semibold text-[#111827]">
              {documentData.orderName}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Status
            </p>
            <p className="mt-1 font-semibold text-[#111827]">
              {documentData.orderStatus}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Monedă
            </p>
            <p className="mt-1 font-semibold text-[#111827]">
              {documentData.currency}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">
              Data comenzii
            </p>
            <p className="mt-1 font-semibold text-[#111827]">
              {documentData.orderDate}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-[11px] font-bold uppercase text-[#64748b]">
            Produse
          </p>

          <div className="mt-3 overflow-hidden border border-[#d8dde3] print:overflow-visible">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#f7f8fa] text-[11px] font-bold uppercase text-[#64748b]">
                <tr className="print:break-inside-avoid">
                  <th className="px-4 py-3">Produs</th>
                  <th className="w-24 px-4 py-3 text-right">Cantitate</th>
                  <th className="w-32 px-4 py-3 text-right">Preț unitar</th>
                  <th className="w-32 px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {documentData.lines.length > 0 ? (
                  documentData.lines.map((line, index) => (
                    <tr
                      key={`${line.title}-${index}`}
                      className="print:break-inside-avoid"
                    >
                      <td className="px-4 py-3 font-medium text-[#111827]">
                        {line.title}
                        {line.detail && (
                          <p className="mt-1 text-xs font-normal text-[#64748b]">
                            {line.detail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569]">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569]">
                        {line.unitPrice}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569]">
                        {line.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="print:break-inside-avoid">
                    <td className="px-4 py-4 font-medium text-[#111827]">
                      Produse indisponibile în documentul demo minimal
                    </td>
                    <td className="px-4 py-4 text-right text-[#475569]">-</td>
                    <td className="px-4 py-4 text-right text-[#475569]">-</td>
                    <td className="px-4 py-4 text-right text-[#475569]">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            {documentData.subtotal && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="font-semibold text-[#111827]">
                  {documentData.subtotal}
                </span>
              </div>
            )}
            {documentData.shipping && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Transport</span>
                <span className="font-semibold text-[#111827]">
                  {documentData.shipping}
                </span>
              </div>
            )}
            {documentData.tax && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">TVA demo</span>
                <span className="font-semibold text-[#111827]">
                  {documentData.tax}
                </span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#d8dde3] pt-3">
              <span className="text-base font-bold text-[#111827]">Total</span>
              <span className="text-xl font-bold text-[#111827]">
                {documentData.total}
              </span>
            </div>
          </div>
        </section>

        <footer className="mt-12 grid gap-8 border-t border-[#e2e8f0] pt-6 text-xs leading-5 text-[#64748b] sm:grid-cols-[1fr_220px]">
          <p>
            Acest document este generat pentru demonstrație și nu reprezintă
            factură fiscală reală. Documentul nu include tokenuri, secrete sau
            acces public la detalii complete ale comenzii.
          </p>
          <div className="pt-6 text-center">
            <div className="border-t border-dashed border-[#94a3b8] pt-2">
              Semnătură / ștampilă demo
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default async function DemoInvoiceDownloadPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const normalizedId = normalizeOrderId(resolvedParams.id)

  if (normalizedId.kind === 'invalid') {
    return <ErrorState message={normalizedId.message} />
  }

  if (normalizedId.kind === 'demo') {
    return (
      <InvoiceDocument
        documentData={mapDemoToDocumentData(
          resolvedParams.id,
          resolvedSearchParams
        )}
      />
    )
  }

  const session = await getAdminSession()

  if (!isValidAdminSession(session)) {
    return <UnauthorizedState />
  }

  const result = await fetchOrderDocumentData(
    normalizedId.gid,
    resolvedSearchParams
  )

  if (result.error || !result.data) {
    return <ErrorState message={result.error || 'Comanda nu poate fi încărcată.'} />
  }

  return <InvoiceDocument documentData={result.data} />
}
