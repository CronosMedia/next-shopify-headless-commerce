import Link from 'next/link'
import {
  loadInvoiceDocument,
  type InvoiceDocumentData,
  type InvoiceSearchParams,
} from '@/lib/invoice-document.server'
import {PrintButton} from './PrintButton'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<InvoiceSearchParams>
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

function InvoiceDocument({
  documentData,
  pdfHref,
}: {
  documentData: InvoiceDocumentData
  pdfHref: string
}) {
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
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={pdfHref}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#115e59]"
            >
              Descarcă PDF
            </Link>
            <PrintButton documentTitle={documentData.printDocumentTitle} />
          </div>
          <p className="max-w-xs text-xs leading-5 text-[#64748b]">
            Pentru print din browser, debifează „Headers and footers” în
            dialogul de print. PDF-ul descărcat este generat fără header/footer
            de browser.
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
  const result = await loadInvoiceDocument(resolvedParams.id, resolvedSearchParams)

  if (result.status === 'unauthorized') {
    return <UnauthorizedState />
  }

  if (result.status === 'error') {
    return <ErrorState message={result.message} />
  }

  const query = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
      return
    }

    if (value) {
      query.set(key, value)
    }
  })

  const pdfHref = `/invoice/download/${encodeURIComponent(resolvedParams.id)}/pdf${
    query.toString() ? `?${query.toString()}` : ''
  }`

  return <InvoiceDocument documentData={result.data} pdfHref={pdfHref} />
}
