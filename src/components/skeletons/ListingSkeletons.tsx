function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%] ${className}`}
    />
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-16 md:mb-24" aria-hidden="true">
      <SkeletonBlock className="h-3 w-36 mx-auto mb-4" />
      <SkeletonBlock className="h-9 md:h-11 lg:h-12 w-56 md:w-72 mx-auto" />
      <div className="h-[1px] w-12 bg-[#1a1a1a]/20 mx-auto mt-6" />
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="group relative flex flex-col h-full bg-white" aria-hidden="true">
      <div className="relative overflow-hidden aspect-[3/4] bg-[#F9F8F6]">
        <SkeletonBlock className="absolute inset-0" />
        <SkeletonBlock className="absolute bottom-0 left-0 right-0 hidden lg:block h-12 border-t border-[var(--border)] bg-white/80" />
      </div>

      <div className="pt-4 pb-3 flex flex-col items-start px-0.5">
        <SkeletonBlock className="h-3 w-20 mb-2" />
        <SkeletonBlock className="h-4 w-full max-w-[84%]" />
        <SkeletonBlock className="mt-3 h-4 w-16" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="w-full">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function CollectionCardSkeleton() {
  return (
    <div
      className="group block relative overflow-hidden aspect-[3/5] md:aspect-[4/5] bg-[#F9F8F6] shadow-sm flex-shrink-0 w-[75vw] max-w-[280px] snap-center md:w-auto md:max-w-none md:snap-align-none"
      aria-hidden="true"
    >
      <SkeletonBlock className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
        <SkeletonBlock className="h-6 md:h-7 w-36 bg-white/25" />
        <SkeletonBlock className="mt-3 h-3 w-full max-w-[210px] bg-white/20" />
        <SkeletonBlock className="mt-2 h-3 w-2/3 max-w-[160px] bg-white/20" />
        <SkeletonBlock className="mt-5 h-3 w-24 bg-white/25" />
      </div>
    </div>
  )
}

export function CollectionGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:gap-10 lg:gap-12 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <CollectionCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function CollectionToolbarSkeleton() {
  return (
    <div className="relative border-b border-[var(--border)] py-4 bg-[var(--background)] z-30" aria-hidden="true">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-[38px] w-[92px] sm:w-[116px] border border-neutral-300 bg-white" />
          <SkeletonBlock className="hidden md:block h-3 w-24" />
          <SkeletonBlock className="h-[38px] w-[96px] sm:w-[142px] border border-neutral-300 bg-white" />
        </div>
      </div>
    </div>
  )
}
