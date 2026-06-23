import { ProductGridSkeleton } from '@/components/skeletons/ListingSkeletons'

export default function WishlistLoading() {
    return (
        <main className="w-full px-4 md:px-8 lg:px-12 py-10">
            <div className="mb-8 md:mb-10" aria-hidden="true">
                <div className="h-3 w-36 mb-3 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
                <div className="h-8 md:h-9 w-72 max-w-full animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
                <div className="mt-4 h-4 w-full max-w-md animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
            </div>

            <div className="relative min-h-screen bg-[var(--background)]">
                <div className="relative border-b border-[var(--border)] py-4 bg-[var(--background)] z-10">
                    <div className="h-3 w-32 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
                </div>

                <div className="w-full py-10 pb-24">
                    <ProductGridSkeleton className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
                </div>
            </div>
        </main>
    )
}
