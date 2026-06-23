function AccountLoadingBlock({className}: {className: string}) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />
}

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-6 sm:p-6" aria-hidden="true">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <AccountLoadingBlock className="mb-3 h-8 w-64 max-w-full" />
          <AccountLoadingBlock className="h-5 w-48 max-w-full" />
        </div>
        <AccountLoadingBlock className="h-10 w-36" />
      </div>

      <div className="lg:hidden -mx-4 mb-6 border-y border-[var(--border)] bg-[var(--background)] py-4">
        <AccountLoadingBlock className="mx-4 mb-3 h-3 w-36" />
        <div className="flex gap-2 overflow-hidden px-4">
          {Array.from({length: 4}, (_, index) => (
            <AccountLoadingBlock key={index} className="h-10 w-32 shrink-0" />
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <aside className="hidden border-t border-[var(--border)] pt-5 lg:block">
          <AccountLoadingBlock className="mb-4 h-3 w-36" />
          <div className="space-y-2">
            {Array.from({length: 6}, (_, index) => (
              <AccountLoadingBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-3">
          <div className="border border-[var(--border)] bg-white p-5 md:p-6 lg:p-8">
            <AccountLoadingBlock className="mb-6 h-6 w-48" />
            <div className="space-y-4">
              {Array.from({length: 3}, (_, index) => (
                <div key={index} className="border border-[var(--border)] bg-[#F9F8F6]/45 p-4 md:p-5">
                  <AccountLoadingBlock className="mb-3 h-3 w-24" />
                  <AccountLoadingBlock className="h-5 w-56 max-w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
