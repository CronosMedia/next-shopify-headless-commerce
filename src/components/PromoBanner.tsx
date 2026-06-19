'use client'

export default function PromoBanner() {
  return (
    <div className="bg-[#1a1a1a] h-12 md:h-10 flex items-center justify-center text-center">
      <div className="max-w-full mx-auto px-4">
        <p className="text-[11px] sm:text-[12px] md:text-[13px] font-medium tracking-wide text-white/90 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
          <span>Livrare gratuită la comenzi de peste 500 lei</span>
          <span className="hidden md:inline">&nbsp;·&nbsp;</span>
          <span>Cod promoțional: <span className="text-white font-bold">OUTDOOR</span></span>
        </p>
      </div>
    </div>
  )
}
