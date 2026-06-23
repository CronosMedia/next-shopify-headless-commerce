import {
  CollectionGridSkeleton,
  PageHeaderSkeleton,
} from '@/components/skeletons/ListingSkeletons'

export default function CollectionsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-12 pb-0 md:pt-24 md:pb-24">
      <PageHeaderSkeleton />
      <CollectionGridSkeleton />
    </div>
  )
}
