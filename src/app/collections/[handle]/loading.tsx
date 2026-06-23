import {
  CollectionToolbarSkeleton,
  ProductGridSkeleton,
} from '@/components/skeletons/ListingSkeletons'

function CollectionTitleSkeleton() {
  return (
    <div className="mb-6" aria-hidden="true">
      <div className="h-8 md:h-9 w-56 md:w-72 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
    </div>
  )
}

export default function CollectionLoading() {
  return (
    <main className="w-full px-4 md:px-8 lg:px-12 py-10">
      <CollectionTitleSkeleton />

      <div className="relative min-h-screen bg-[var(--background)]">
        <CollectionToolbarSkeleton />

        <div className="w-full px-4 md:px-8 lg:px-12 py-10 pb-24">
          <div className="md:hidden h-3 w-20 mb-6 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%]" />
          <ProductGridSkeleton />
        </div>
      </div>
    </main>
  )
}
