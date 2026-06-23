import {
  PageHeaderSkeleton,
  ProductGridSkeleton,
} from '@/components/skeletons/ListingSkeletons'

export default function NewArrivalsLoading() {
  return (
    <main className="w-full px-4 md:px-8 lg:px-12 py-10">
      <PageHeaderSkeleton />

      <div className="relative min-h-screen bg-[var(--background)]">
        <div className="w-full px-4 md:px-8 lg:px-12 py-10 pb-24">
          <ProductGridSkeleton />
        </div>
      </div>
    </main>
  )
}
