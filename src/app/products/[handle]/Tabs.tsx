export default function Tabs({
  descriptionHtml,
}: {
  descriptionHtml: string
  details?: { label: string; value: string }[]
}) {
  return (
    <div className="space-y-32">
      {/* Description Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-[#f0efed] pt-12">
        <div className="md:col-span-4">
          <h3 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#1a1a1a]">
            Description
          </h3>
        </div>
        <div className="md:col-span-8">
          <div
            className="text-[14px] font-normal leading-[1.8] text-[#4a4a4a] prose-strong:font-semibold prose-strong:text-[#1a1a1a] max-w-xl"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </div>
      </section>

      {/* Shipping & Reviews Mixed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-24 border-t border-[#f0efed] pt-12">
        {/* Shipping */}
        <section className="space-y-8">
          <h3 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#1a1a1a]">
            Shipping & Returns
          </h3>
          <div className="text-[13px] font-normal leading-relaxed text-[#4a4a4a] space-y-4 max-w-sm">
            <p>
              Standard shipping (2-4 business days) is complimentary on all orders
              above £200.
            </p>
            <p>
              Returns may be initiated within 30 days of delivery. All items must
              be in their original condition.
            </p>
          </div>
        </section>

        {/* Reviews */}
        <section className="space-y-12">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#1a1a1a]">
              Reviews
            </h3>
            <span className="text-[10px] text-[#b1b1b1] tracking-widest uppercase italic">4.8 Average</span>
          </div>

          <div className="space-y-16">
            <div className="space-y-4 border-l-2 border-[#1a1a1a] pl-6 transition-all hover:border-[#8a8a8a]">
              <p className="text-[14px] font-light italic leading-relaxed text-[#1a1a1a]">
                &ldquo;The quality of the finish is beyond what I expected. A truly minimalist masterpiece that functions as good as it looks.&rdquo;
              </p>
              <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-[#8a8a8a]">
                <span>Maria G.</span>
                <span className="w-1 h-1 rounded-full bg-[#f0efed]" />
                <span>Verified Purchase</span>
              </div>
            </div>

            <div className="space-y-4 border-l-2 border-[#f0efed] pl-6 transition-all hover:border-[#1a1a1a]">
              <p className="text-[14px] font-light italic leading-relaxed text-[#1a1a1a]">
                &ldquo;Exceptional craftsmanship. The delivery was seamless and the packaging reflects the premium nature of the brand.&rdquo;
              </p>
              <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-[#8a8a8a]">
                <span>Andreas K.</span>
                <span className="w-1 h-1 rounded-full bg-[#f0efed]" />
                <span>Verified Purchase</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
