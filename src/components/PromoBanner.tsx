'use client'

export default function PromoBanner() {
  return (
    <div className="bg-[#1a1a1a] text-[#e8e6e1] text-center py-2.5">
      <div className="max-w-full mx-auto px-4">
        <p className="text-[11px] font-light tracking-[0.2em] uppercase">
          Complimentary shipping on orders over £200 &nbsp;·&nbsp; Use code <span className="text-[var(--accent)] font-normal">LUXURY</span>
        </p>
      </div>
    </div>
  )
}
