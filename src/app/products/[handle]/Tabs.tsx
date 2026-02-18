'use client'

import AccordionGroup, { AccordionItem } from '@/components/Accordion'
import ReviewsSection from '@/components/ReviewsSection'

export default function Tabs({
  descriptionHtml,
  details,
}: {
  descriptionHtml: string
  details?: { label: string; value: string }[]
}) {
  return (
    <div className="space-y-12">
      <div className="space-y-12">
        {/* Mobile: Accordion Layout */}
        <div className="md:hidden">
          <AccordionGroup>
            <AccordionItem title="Descriere" defaultOpen={true}>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </AccordionItem>

            <AccordionItem title="Specificații">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                {details?.map((d) => (
                  <div key={d.label} className="flex gap-2 text-sm border-b border-gray-100 pb-2 last:border-0">
                    <dt className="w-32 font-medium text-gray-900 shrink-0">{d.label}</dt>
                    <dd className="text-gray-600">{d.value}</dd>
                  </div>
                )) || <div className="text-sm text-gray-500">Nu există specificații disponibile.</div>}
              </dl>
            </AccordionItem>

            <AccordionItem title="Livrare și Retur">
              <div className="prose prose-sm max-w-none text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Livrare Rapidă</h4>
                <p className="mb-4">Comenzile plasate până în ora 14:00 sunt procesate în aceeași zi. Livrarea standard durează 24-48 de ore lucrătoare oriunde în România.</p>

                <h4 className="font-medium text-gray-900 mb-2">Retur Simplu</h4>
                <p>Dacă produsul nu ți se potrivește, îl poți returna în termen de 30 de zile. Procesul este simplu și rapid, direct din contul tău de client.</p>
              </div>
            </AccordionItem>
          </AccordionGroup>
        </div>

        {/* Desktop: Expanded Vertical Layout */}
        <div className="hidden md:block space-y-16">
          <section id="overview" className="scroll-mt-32">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Descriere</h3>
            <div
              className="prose max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </section>

          <section id="specifications" className="scroll-mt-32 pt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Specificații</h3>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              {details?.map((d) => (
                <div key={d.label} className="flex gap-2 text-sm border-b border-gray-100 pb-2">
                  <dt className="w-40 font-medium text-gray-900 shrink-0">{d.label}</dt>
                  <dd className="text-gray-600">{d.value}</dd>
                </div>
              )) || <div className="text-sm text-gray-500">Nu există specificații disponibile.</div>}
            </dl>
          </section>

          <section className="pt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Livrare și Returi</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">🚚</span> Livrare Rapidă
                </h4>
                <p className="text-sm text-gray-600">Comenzile plasate până în ora 14:00 sunt procesate în aceeași zi. Livrarea standard durează 24-48 de ore lucrătoare oriunde în România.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">↩️</span> Retur Simplu
                </h4>
                <p className="text-sm text-gray-600">Dacă produsul nu ți se potrivește, îl poți returna în termen de 30 de zile. Procesul este simplu și rapid.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Reviews Section Separated for Impact */}
      <div id="reviews" className="scroll-mt-24">
        <h3 className="text-lg font-medium text-gray-900 mb-6 border-b border-gray-200 pb-4">Recenzii și Întrebări</h3>
        <ReviewsSection />
      </div>
    </div>
  )
}