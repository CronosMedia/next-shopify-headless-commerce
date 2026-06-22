import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Package,
  Truck,
} from 'lucide-react'
import {AdminCard, AdminShell} from '@/components/admin/AdminShell'
import {getAdminSession, isValidAdminSession} from '@/lib/admin-session'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {formatMoney} from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type PageProps = {
  params: Promise<{
    id: string
  }>
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

type LineImage = {
  url: string
  altText: string | null
  width: number | null
  height: number | null
} | null

type AdminOrderDetails = {
  id: string
  legacyResourceId: string
  name: string
  createdAt: string
  processedAt: string | null
  email: string | null
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  totalPriceSet: {shopMoney: Money}
  subtotalPriceSet: {shopMoney: Money}
  totalShippingPriceSet: {shopMoney: Money}
  totalTaxSet: {shopMoney: Money}
  customAttributes: Array<{key: string; value: string}>
  customer: {
    displayName: string
    email: string | null
  } | null
  billingAddress: MailingAddress | null
  shippingAddress: MailingAddress | null
  lineItems: {
    nodes: Array<{
      id: string
      title: string
      quantity: number
      sku: string | null
      variantTitle: string | null
      image: LineImage
      originalUnitPriceSet: {shopMoney: Money}
      discountedTotalSet: {shopMoney: Money}
    }>
  }
  fulfillments: Array<{
    trackingInfo: Array<{
      company: string | null
      number: string
      url: string
    }>
  }>
  invoicePdfUrl: {value: string} | null
  invoiceNumber: {value: string} | null
  invoiceSeries: {value: string} | null
  invoiceProvider: {value: string} | null
  invoiceStatus: {value: string} | null
  awbCode: {value: string} | null
  awbProvider: {value: string} | null
  awbStatus: {value: string} | null
  courierName: {value: string} | null
  awbTrackingUrl: {value: string} | null
}

type AdminOrderDetailsResponse = {
  order: AdminOrderDetails | null
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral'

type BillingSummary = {
  hasDetails: boolean
  isBusiness: boolean
  warning: string
  rows: Array<{
    label: string
    value: string
  }>
}

const GET_ADMIN_ORDER_DETAILS_QUERY = `#graphql
  query GetAdminOrderDetails($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      processedAt
      email
      displayFinancialStatus
      displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      subtotalPriceSet { shopMoney { amount currencyCode } }
      totalShippingPriceSet { shopMoney { amount currencyCode } }
      totalTaxSet { shopMoney { amount currencyCode } }
      customAttributes { key value }
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
      lineItems(first: 100) {
        nodes {
          id
          title
          quantity
          sku
          variantTitle
          image {
            url
            altText
            width
            height
          }
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          discountedTotalSet { shopMoney { amount currencyCode } }
        }
      }
      fulfillments(first: 5) {
        trackingInfo {
          company
          number
          url
        }
      }
      invoicePdfUrl: metafield(namespace: "custom", key: "invoice_pdf_url") {
        value
      }
      invoiceNumber: metafield(namespace: "custom", key: "invoice_number") {
        value
      }
      invoiceSeries: metafield(namespace: "custom", key: "invoice_series") {
        value
      }
      invoiceProvider: metafield(namespace: "custom", key: "invoice_provider") {
        value
      }
      invoiceStatus: metafield(namespace: "custom", key: "invoice_status") {
        value
      }
      awbCode: metafield(namespace: "custom", key: "awb_code") {
        value
      }
      awbProvider: metafield(namespace: "custom", key: "awb_provider") {
        value
      }
      awbStatus: metafield(namespace: "custom", key: "awb_status") {
        value
      }
      courierName: metafield(namespace: "custom", key: "courier_name") {
        value
      }
      awbTrackingUrl: metafield(namespace: "custom", key: "awb_tracking_url") {
        value
      }
    }
  }
`

const paymentStatusLabels: Record<string, string> = {
  authorized: 'Autorizată',
  expired: 'Expirată',
  failed: 'Eșuată',
  paid: 'Plătită',
  partially_paid: 'Parțial plătită',
  partially_refunded: 'Parțial rambursată',
  pending: 'În așteptare',
  refunded: 'Rambursată',
  voided: 'Anulată',
}

const fulfillmentStatusLabels: Record<string, string> = {
  fulfilled: 'Livrată',
  in_progress: 'În procesare',
  on_hold: 'În așteptare',
  open: 'Nelivrată',
  partially_fulfilled: 'Parțial livrată',
  pending_fulfillment: 'În pregătire',
  restocked: 'Returnată în stoc',
  scheduled: 'Programată',
  unfulfilled: 'Nelivrată',
}

const documentStatusLabels: Record<string, {invoice: string; awb: string}> = {
  error: {
    invoice: 'Eroare',
    awb: 'Eroare',
  },
  issued: {
    invoice: 'Emisă',
    awb: 'Generat',
  },
  missing: {
    invoice: 'Lipsă',
    awb: 'Lipsă',
  },
  simulated: {
    invoice: 'Simulată',
    awb: 'Simulat',
  },
}

const providerLabels: Record<string, string> = {
  demo: 'Demo',
  oblio: 'Oblio',
  smartbill: 'SmartBill',
}

function normalizeOrderGid(rawId: string) {
  const decodedId = decodeURIComponent(rawId)

  if (decodedId.startsWith('gid://shopify/Order/')) {
    return decodedId
  }

  return `gid://shopify/Order/${decodedId}`
}

function normalizeKey(value: string | null | undefined) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
}

function humanizeFallback(value: string | null | undefined) {
  const normalized = normalizeKey(value)

  if (!normalized) return 'Necunoscut'

  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPaymentStatus(value: string) {
  const key = normalizeKey(value)
  return paymentStatusLabels[key] || humanizeFallback(value)
}

function formatFulfillmentStatus(value: string) {
  const key = normalizeKey(value)
  return fulfillmentStatusLabels[key] || humanizeFallback(value)
}

function formatDocumentStatus(
  value: string | null | undefined,
  type: 'invoice' | 'awb'
) {
  const key = normalizeKey(value) || 'missing'
  return documentStatusLabels[key]?.[type] || humanizeFallback(value)
}

function formatProviderName(value: string | null | undefined) {
  const key = normalizeKey(value)
  return providerLabels[key] || humanizeFallback(value)
}

function getTone(value: string | null | undefined): Tone {
  const key = normalizeKey(value)

  if (key === 'paid' || key === 'fulfilled' || key === 'issued') return 'success'
  if (key === 'simulated') return 'success'
  if (key === 'failed' || key === 'error' || key === 'voided') return 'danger'
  if (key === 'pending' || key === 'missing' || key === 'unfulfilled') {
    return 'warning'
  }

  return 'neutral'
}

function getEffectiveInvoiceStatus(order: AdminOrderDetails) {
  const rawStatus = order.invoiceStatus?.value
  const invoiceParts = parseInvoiceParts(order)

  if (rawStatus && normalizeKey(rawStatus) !== 'missing') {
    return rawStatus
  }

  if (invoiceParts.number || order.invoicePdfUrl?.value) {
    return 'simulated'
  }

  return 'missing'
}

function getInvoiceAvailability(order: AdminOrderDetails) {
  const invoiceParts = parseInvoiceParts(order)
  const statusKey = normalizeKey(getEffectiveInvoiceStatus(order))
  const hasInvoiceNumber = Boolean(invoiceParts.series && invoiceParts.number)
  const hasProviderPdf = Boolean(order.invoicePdfUrl?.value?.trim())
  const hasLocalDocument =
    hasInvoiceNumber && (statusKey === 'issued' || statusKey === 'simulated')
  const hasPdfDocument = hasProviderPdf || hasLocalDocument
  const isAvailable = hasLocalDocument || hasPdfDocument

  return {
    hasLocalDocument,
    hasPdfDocument,
    hasProviderPdf,
    isAvailable,
    status: isAvailable ? getEffectiveInvoiceStatus(order) : 'missing',
  }
}

function getEffectiveAwbStatus(order: AdminOrderDetails) {
  const rawStatus = order.awbStatus?.value

  if (rawStatus && normalizeKey(rawStatus) !== 'missing') {
    return rawStatus
  }

  if (order.awbCode?.value) {
    return 'simulated'
  }

  return 'missing'
}

function getAwbAvailability(order: AdminOrderDetails, trackingUrl: string) {
  const statusKey = normalizeKey(getEffectiveAwbStatus(order))
  const hasAwbCode = Boolean(order.awbCode?.value?.trim())
  const isAvailable =
    hasAwbCode && (statusKey === 'issued' || statusKey === 'simulated')
  const hasTracking = isAvailable && Boolean(trackingUrl.trim())

  return {
    hasTracking,
    isAvailable,
    status: isAvailable ? getEffectiveAwbStatus(order) : 'missing',
    trackingLabel: statusKey === 'simulated' ? 'Tracking demo' : 'Tracking',
  }
}

function formatLongDate(value: string | null) {
  if (!value) return 'Dată indisponibilă'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă'

  const formatted = new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function parseInvoiceParts(order: AdminOrderDetails) {
  const rawSeries = order.invoiceSeries?.value?.trim() || 'DEMO'
  const rawNumber = order.invoiceNumber?.value?.trim() || ''
  const normalizedSeries = rawSeries || 'DEMO'
  const prefixedNumberPattern = new RegExp(
    `^${normalizedSeries.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`,
    'i'
  )
  const numberWithoutSeries = rawNumber.replace(prefixedNumberPattern, '').trim()

  if (numberWithoutSeries) {
    return {
      series: normalizedSeries,
      number: numberWithoutSeries,
    }
  }

  const splitNumber = rawNumber.match(/^([A-Za-z]+)\s+(.+)$/)

  if (splitNumber) {
    return {
      series: splitNumber[1],
      number: splitNumber[2],
    }
  }

  return {
    series: normalizedSeries,
    number: rawNumber,
  }
}

function getInvoiceQuery(order: AdminOrderDetails) {
  const query = new URLSearchParams()
  const {series, number} = parseInvoiceParts(order)

  if (series) query.set('series', series)
  if (number) query.set('number', number)

  return query.toString()
}

function getInvoiceHref(order: AdminOrderDetails, pdf = false) {
  const query = getInvoiceQuery(order)
  const baseHref = `/invoice/download/${encodeURIComponent(
    order.legacyResourceId
  )}${pdf ? '/pdf' : ''}`

  return query ? `${baseHref}?${query}` : baseHref
}

function getFirstTracking(order: AdminOrderDetails) {
  return order.fulfillments
    .flatMap((fulfillment) => fulfillment.trackingInfo)
    .find((tracking) => tracking.number || tracking.url)
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line))
}

function formatAddress(address: MailingAddress | null) {
  if (!address) return []

  return compactLines([
    address.name,
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(', '),
    address.country,
  ])
}

function getAttribute(order: AdminOrderDetails, labels: string | string[]) {
  const wantedLabels = Array.isArray(labels) ? labels : [labels]
  const attribute = order.customAttributes.find((item) =>
    wantedLabels.some((label) => normalizeKey(item.key) === normalizeKey(label))
  )

  return attribute?.value?.trim() || ''
}

function normalizeYesNo(value: string) {
  const key = normalizeKey(value)

  if (!key) return ''
  if (['da', 'yes', 'true', '1'].includes(key)) return 'Da'
  if (['nu', 'no', 'false', '0'].includes(key)) return 'Nu'

  return value
}

function isBusinessBilling(order: AdminOrderDetails) {
  const firmFlag = normalizeYesNo(getAttribute(order, 'Facturare pe firmă'))
  const type = normalizeKey(
    getAttribute(order, ['Tip Facturare', 'Tip facturare'])
  )

  return (
    firmFlag === 'Da' ||
    type.includes('juridica') ||
    type.includes('firma') ||
    Boolean(getAttribute(order, ['Denumire Firmă', 'Firmă', 'Companie'])) ||
    Boolean(getAttribute(order, ['Cod Unic de Înregistrare (CUI)', 'CUI']))
  )
}

function getBillingSummary(order: AdminOrderDetails): BillingSummary {
  const isBusiness = isBusinessBilling(order)
  const company = getAttribute(order, ['Denumire Firmă', 'Firmă', 'Companie'])
  const cui = getAttribute(order, ['Cod Unic de Înregistrare (CUI)', 'CUI'])
  const regCom = getAttribute(order, [
    'Număr Registrul Comerțului',
    'Reg. Com.',
    'Nr. Reg. Com.',
  ])
  const customBillingAddress = getAttribute(order, [
    'Adresă Facturare',
    'Adresă facturare',
  ])
  const billingAddress = customBillingAddress || formatAddress(order.billingAddress).join(', ')
  const vatPayer = normalizeYesNo(
    getAttribute(order, ['TVA', 'Plătitor TVA', 'Platitor TVA'])
  )
  const eFactura = normalizeYesNo(
    getAttribute(order, ['e-Invoice', 'e-Factura', 'Factura e-Invoice'])
  )
  const hasExplicitBillingRequest =
    normalizeYesNo(getAttribute(order, 'Factură solicitată')) === 'Da'
  const hasDetails = Boolean(
    hasExplicitBillingRequest ||
      isBusiness ||
      company ||
      cui ||
      regCom ||
      vatPayer ||
      eFactura ||
      customBillingAddress
  )
  const rows = [
    {
      label: 'Tip factură',
      value: isBusiness ? 'Persoană juridică' : 'Persoană fizică',
    },
    {
      label: 'Firmă',
      value: company,
    },
    {
      label: 'CUI',
      value: cui,
    },
    {
      label: 'Reg. Com.',
      value: regCom,
    },
    {
      label: 'Plătitor TVA',
      value: vatPayer || 'Nu',
    },
    {
      label: 'e-Factura',
      value: eFactura || 'Nu',
    },
    {
      label: 'Adresă facturare',
      value: billingAddress,
    },
  ].filter((row) => row.value)
  const warning =
    isBusiness && (!company || !cui || !billingAddress)
      ? 'Date de facturare incomplete pentru persoană juridică. Verifică firma, CUI-ul și adresa înainte de emiterea facturii.'
      : ''

  return {
    hasDetails,
    isBusiness,
    rows: hasDetails || isBusiness ? rows : [],
    warning,
  }
}

function StatusText({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: Tone
}) {
  const toneClass = {
    danger: 'text-rose-700',
    neutral: 'text-[#5c5f62]',
    success: 'text-[#008060]',
    warning: 'text-amber-700',
  }[tone]

  return <span className={`font-semibold ${toneClass}`}>{children}</span>
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: Tone
}) {
  const toneClass = {
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    neutral: 'border-[#d2d5d8] bg-[#f6f6f7] text-[#5c5f62]',
    success: 'border-[#b3dfd0] bg-[#f0faf6] text-[#008060]',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  }[tone]

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
    >
      {children}
    </span>
  )
}

function ActionLink({
  children,
  href,
  variant = 'outline',
}: {
  children: React.ReactNode
  href: string
  variant?: 'primary' | 'outline'
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition ${
        variant === 'primary'
          ? 'border-[#008060] bg-[#008060] text-white hover:bg-[#006e52]'
          : 'border-[#d2d5d8] bg-white text-[#202223] hover:bg-[#f6f6f7]'
      }`}
    >
      {children}
    </Link>
  )
}

function DisabledAction({
  children,
  variant = 'outline',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
}) {
  return (
    <span
      aria-disabled="true"
      className={`inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold ${
        variant === 'primary'
          ? 'border-[#b3dfd0] bg-[#f0faf6] text-[#6d9f8d]'
          : 'border-[#d2d5d8] bg-[#f6f6f7] text-[#8c9196]'
      }`}
    >
      {children}
    </span>
  )
}

function SmallActionLink({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center justify-center rounded-md border border-[#d2d5d8] bg-white px-2.5 text-xs font-semibold text-[#202223] transition hover:bg-[#f6f6f7]"
    >
      {children}
    </Link>
  )
}

function DisabledSmallAction({children}: {children: React.ReactNode}) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex h-8 cursor-not-allowed items-center justify-center rounded-md border border-[#d2d5d8] bg-[#f6f6f7] px-2.5 text-xs font-semibold text-[#8c9196]"
    >
      {children}
    </span>
  )
}

function DefinitionList({
  rows,
}: {
  rows: Array<{
    label: string
    value: string
  }>
}) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 sm:grid-cols-[120px_1fr]">
          <dt className="font-medium text-[#5c5f62]">{row.label}:</dt>
          <dd className="text-[#202223]">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function AdminOrderUnavailable({message}: {message: string}) {
  return (
    <main className="min-h-screen bg-[#f1f2f4] px-4 py-10 text-[#202223] [font-family:var(--font-geist),sans-serif]">
      <AdminCard className="mx-auto max-w-md">
        <div className="p-8 text-center">
          <h1 className="text-lg font-semibold">Detalii comandă</h1>
          <p className="mt-2 text-sm leading-6 text-[#6d7175]">{message}</p>
          <Link
            href="/admin"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-md border border-[#008060] bg-[#008060] px-3 text-[13px] font-semibold text-white transition hover:bg-[#006e52]"
          >
            Mergi la admin
          </Link>
        </div>
      </AdminCard>
    </main>
  )
}

export default async function AdminOrderDetailsPage({params}: PageProps) {
  const session = await getAdminSession()

  if (!isValidAdminSession(session)) {
    return <AdminOrderUnavailable message="Acces neautorizat." />
  }

  const {id} = await params
  const orderGid = normalizeOrderGid(id)
  const response = await shopifyAdminRequest<AdminOrderDetailsResponse>(
    GET_ADMIN_ORDER_DETAILS_QUERY,
    {id: orderGid}
  )

  if (response.errors?.length) {
    return <AdminOrderUnavailable message={response.errors[0].message} />
  }

  const order = response.data?.order

  if (!order) {
    return <AdminOrderUnavailable message="Comanda nu a fost găsită." />
  }

  const tracking = getFirstTracking(order)
  const invoiceParts = parseInvoiceParts(order)
  const billingSummary = getBillingSummary(order)
  const customerName = order.customer?.displayName || 'Client anonim'
  const invoiceHref = getInvoiceHref(order)
  const invoicePdfHref = getInvoiceHref(order, true)
  const trackingHref = order.awbTrackingUrl?.value || tracking?.url || ''
  const invoiceAvailability = getInvoiceAvailability(order)
  const invoicePdfActionHref = order.invoicePdfUrl?.value || invoicePdfHref
  const awbAvailability = getAwbAvailability(order, trackingHref)
  const invoiceStatus = invoiceAvailability.status
  const awbStatus = awbAvailability.status
  const shippingAddressLines = formatAddress(order.shippingAddress)
  const orderTotal = formatMoney(
    order.totalPriceSet.shopMoney.amount,
    order.totalPriceSet.shopMoney.currencyCode
  )
  const paymentTone = getTone(order.displayFinancialStatus)
  const fulfillmentTone = getTone(order.displayFulfillmentStatus)

  return (
    <AdminShell
      title="Detalii comandă"
      subtitle={`${order.name} · ${customerName}`}
    >
      <div className="mx-auto w-full max-w-[1180px] space-y-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Înapoi la comenzi
        </Link>

        <AdminCard className="overflow-hidden">
          <div className="border-b border-[#e1e3e5] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center">
                <div className="text-[24px] font-semibold leading-tight text-[#202223]">
                  {formatLongDate(order.processedAt || order.createdAt)}
                </div>
                <div className="hidden h-12 w-px bg-[#d2d5d8] md:block" />
                <div className="space-y-1 text-[15px] text-[#6d7175]">
                  <p>
                    Comanda nr:{' '}
                    <span className="font-semibold text-[#202223]">
                      {order.name}
                    </span>
                  </p>
                  <p>
                    Total:{' '}
                    <span className="font-semibold text-[#202223]">
                      {orderTotal}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {invoiceAvailability.hasLocalDocument ? (
                  <ActionLink href={invoiceHref}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Deschide factura
                  </ActionLink>
                ) : (
                  <DisabledAction>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Deschide factura
                  </DisabledAction>
                )}
                {invoiceAvailability.hasPdfDocument ? (
                  <ActionLink href={invoicePdfActionHref} variant="primary">
                    <FileText className="h-3.5 w-3.5" />
                    Descarcă PDF
                  </ActionLink>
                ) : (
                  <DisabledAction variant="primary">
                    <FileText className="h-3.5 w-3.5" />
                    Descarcă PDF
                  </DisabledAction>
                )}
                {awbAvailability.hasTracking && (
                  <ActionLink href={trackingHref}>
                    <Truck className="h-3.5 w-3.5" />
                    {awbAvailability.trackingLabel}
                  </ActionLink>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 lg:grid-cols-3">
            <section>
              <h2 className="text-lg font-semibold text-[#202223]">
                Adresa de livrare
              </h2>
              {shippingAddressLines.length > 0 ? (
                <div className="mt-3 space-y-1 text-sm leading-6 text-[#5c5f62]">
                  {shippingAddressLines.map((line, index) => (
                    <p
                      key={`${line}-${index}`}
                      className={index === 0 ? 'font-semibold text-[#202223]' : ''}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#6d7175]">
                  Nu a fost furnizată nicio adresă de livrare.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#202223]">
                Detalii facturare
              </h2>
              {billingSummary.hasDetails || billingSummary.isBusiness ? (
                <div className="mt-3 space-y-3">
                  <DefinitionList rows={billingSummary.rows} />
                  {billingSummary.warning && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      {billingSummary.warning}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#6d7175]">
                  Nu există date de facturare suplimentare pentru această
                  comandă.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#202223]">
                Status comandă
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="font-medium text-[#5c5f62]">Plată:</span>{' '}
                  <StatusText tone={paymentTone}>
                    {formatPaymentStatus(order.displayFinancialStatus)}
                  </StatusText>
                </p>
                <p>
                  <span className="font-medium text-[#5c5f62]">Livrare:</span>{' '}
                  <StatusText tone={fulfillmentTone}>
                    {formatFulfillmentStatus(order.displayFulfillmentStatus)}
                  </StatusText>
                </p>
                {(tracking?.company || tracking?.number) && (
                  <div className="mt-4 border-t border-[#f1f2f3] pt-4">
                    {tracking.company && (
                      <p>
                        <span className="font-medium text-[#5c5f62]">
                          Curier:
                        </span>{' '}
                        <span className="text-[#202223]">{tracking.company}</span>
                      </p>
                    )}
                    {tracking.number && (
                      <p className="mt-1">
                        <span className="font-medium text-[#5c5f62]">AWB:</span>{' '}
                        <span className="text-[#202223]">{tracking.number}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="border-b border-[#e1e3e5] px-5 py-4">
            <h2 className="text-xl font-semibold text-[#202223]">
              Articole în această comandă
            </h2>
          </div>
          <div className="divide-y divide-[#f1f2f3] px-5">
            {order.lineItems.nodes.map((line) => (
              <div
                key={line.id}
                className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_90px_120px_120px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e1e3e5] bg-[#f6f6f7]">
                    {line.image?.url ? (
                      <Image
                        src={line.image.url}
                        alt={line.image.altText || line.title}
                        width={line.image.width || 64}
                        height={line.image.height || 64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-[#8c9196]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#202223]">{line.title}</p>
                    <p className="mt-1 text-sm text-[#6d7175]">
                      {[line.variantTitle, line.sku].filter(Boolean).join(' · ') ||
                        'Fără variantă'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#5c5f62] md:text-right">
                  Cantitate: {line.quantity}
                </p>
                <p className="text-sm text-[#5c5f62] md:text-right">
                  {formatMoney(
                    line.originalUnitPriceSet.shopMoney.amount,
                    line.originalUnitPriceSet.shopMoney.currencyCode
                  )}
                </p>
                <p className="font-semibold text-[#202223] md:text-right">
                  {formatMoney(
                    line.discountedTotalSet.shopMoney.amount,
                    line.discountedTotalSet.shopMoney.currencyCode
                  )}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e1e3e5] bg-[#fbfbfb] px-5 py-4">
            <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between gap-4 text-[#5c5f62]">
                <span>Subtotal</span>
                <span>
                  {formatMoney(
                    order.subtotalPriceSet.shopMoney.amount,
                    order.subtotalPriceSet.shopMoney.currencyCode
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-[#5c5f62]">
                <span>Livrare</span>
                <span>
                  {formatMoney(
                    order.totalShippingPriceSet.shopMoney.amount,
                    order.totalShippingPriceSet.shopMoney.currencyCode
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-[#5c5f62]">
                <span>Taxe</span>
                <span>
                  {formatMoney(
                    order.totalTaxSet.shopMoney.amount,
                    order.totalTaxSet.shopMoney.currencyCode
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#d2d5d8] pt-3 text-base font-bold text-[#202223]">
                <span>Total</span>
                <span>{orderTotal}</span>
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="border-b border-[#e1e3e5] px-5 py-4">
            <h2 className="text-xl font-semibold text-[#202223]">Documente</h2>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#e1e3e5] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#202223]">Factură</p>
                  <p className="mt-1 text-sm text-[#6d7175]">
                    Provider:{' '}
                    {invoiceAvailability.isAvailable
                      ? formatProviderName(order.invoiceProvider?.value || 'demo')
                      : 'Indisponibil'}
                  </p>
                  <p className="mt-1 text-sm text-[#6d7175]">
                    Serie/număr:{' '}
                    {invoiceAvailability.isAvailable
                      ? [invoiceParts.series, invoiceParts.number]
                          .filter(Boolean)
                          .join(' ') || 'Indisponibil'
                      : 'Indisponibil'}
                  </p>
                </div>
                <StatusPill tone={getTone(invoiceStatus)}>
                  {formatDocumentStatus(invoiceStatus, 'invoice')}
                </StatusPill>
              </div>
              {!invoiceAvailability.isAvailable && (
                <p className="mt-3 text-sm text-[#6d7175]">
                  Factura nu a fost generată încă.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {invoiceAvailability.hasLocalDocument ? (
                  <SmallActionLink href={invoiceHref}>Deschide</SmallActionLink>
                ) : (
                  <DisabledSmallAction>Deschide</DisabledSmallAction>
                )}
                {invoiceAvailability.hasPdfDocument ? (
                  <SmallActionLink href={invoicePdfActionHref}>PDF</SmallActionLink>
                ) : (
                  <DisabledSmallAction>PDF</DisabledSmallAction>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[#e1e3e5] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#202223]">AWB</p>
                  <p className="mt-1 text-sm text-[#6d7175]">
                    Cod:{' '}
                    {awbAvailability.isAvailable
                      ? order.awbCode?.value
                      : 'Indisponibil'}
                  </p>
                  <p className="mt-1 text-sm text-[#6d7175]">
                    Curier:{' '}
                    {awbAvailability.isAvailable
                      ? order.courierName?.value || tracking?.company || 'N/A'
                      : 'N/A'}
                  </p>
                </div>
                <StatusPill tone={getTone(awbStatus)}>
                  {formatDocumentStatus(awbStatus, 'awb')}
                </StatusPill>
              </div>
              {!awbAvailability.isAvailable && (
                <p className="mt-3 text-sm text-[#6d7175]">
                  AWB-ul nu a fost generat încă.
                </p>
              )}
              <div className="mt-4">
                {awbAvailability.hasTracking ? (
                  <SmallActionLink href={trackingHref}>
                    {awbAvailability.trackingLabel}
                  </SmallActionLink>
                ) : (
                  <DisabledSmallAction>Tracking</DisabledSmallAction>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-[#f1f2f3] px-5 py-3">
            <p className="text-xs leading-5 text-[#6d7175]">
              Acțiunile de facturare și AWB folosesc endpointurile admin
              securizate.
            </p>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  )
}
