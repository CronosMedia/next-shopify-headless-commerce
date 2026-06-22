'use client'

import {useMemo} from 'react'
import {useParams, useSearchParams} from 'next/navigation'

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function DemoInvoiceDownloadPage() {
  const params = useParams<{ id?: string | string[] }>()
  const searchParams = useSearchParams()

  const orderId = getParamValue(params.id)
  const invoiceSeries = searchParams.get('series') || 'DEMO'
  const invoiceNumber = searchParams.get('number') || ''
  const orderName = searchParams.get('orderName') || orderId
  const customerName = searchParams.get('customer') || 'Client indisponibil'
  const total = searchParams.get('total') || 'Total indisponibil'
  const products = useMemo(() => {
    const rawProducts = searchParams.get('products')
    if (!rawProducts) return []

    return rawProducts
      .split('|')
      .map((product) => product.trim())
      .filter(Boolean)
  }, [searchParams])

  return (
    <main className="min-h-screen bg-[#f4f4f2] px-4 py-8 text-[#202223] print:bg-white print:px-0 print:py-0">
      <section className="mx-auto max-w-3xl border border-[#d2d5d8] bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-[#d2d5d8] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Document de simulare
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Factură demo / document de simulare
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c5f62]">
              Acest document nu este factură fiscală reală și nu produce efecte
              contabile sau fiscale. Este generat pentru fluxul demo al
              magazinului.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#aeb4b9] px-3 text-sm font-semibold text-[#202223] transition hover:bg-[#f6f6f7] print:hidden"
          >
            Printează
          </button>
        </div>

        <div className="grid gap-4 border-b border-[#e1e3e5] py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Serie / număr
            </p>
            <p className="mt-1 text-lg font-bold">
              {[invoiceSeries, invoiceNumber].filter(Boolean).join(' ') ||
                'Indisponibil'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Comandă
            </p>
            <p className="mt-1 text-lg font-bold">{orderName || 'Indisponibil'}</p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-[#e1e3e5] py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Client
            </p>
            <p className="mt-1 text-sm font-semibold">{customerName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold">{total}</p>
          </div>
        </div>

        <div className="py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
            Produse
          </p>
          {products.length > 0 ? (
            <ul className="mt-3 divide-y divide-[#e1e3e5] border-y border-[#e1e3e5]">
              {products.map((product) => (
                <li key={product} className="py-2 text-sm">
                  {product}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#5c5f62]">
              Produsele nu sunt disponibile pentru acest document demo minimal.
            </p>
          )}
        </div>

        <p className="border-t border-[#e1e3e5] pt-4 text-xs leading-5 text-[#6d7175]">
          Documentul nu include tokenuri, secrete sau acces public la detalii
          complete ale comenzii. Pentru factura fiscală reală este necesară o
          integrare completă cu un provider de facturare.
        </p>
      </section>
    </main>
  )
}

export default DemoInvoiceDownloadPage
