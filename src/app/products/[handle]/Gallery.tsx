'use client'
import Image from 'next/image'

export type GalleryImage = {
  url: string
  altText: string | null
  width: number
  height: number
}

export default function Gallery({
  images,
  onMainImageClick,
}: {
  images: GalleryImage[]
  mainImage: GalleryImage
  onThumbnailClick: (imageUrl: string) => void
  onMainImageClick: () => void
}) {
  return (
    <div className="flex flex-col gap-1 md:gap-2">
      {images.map((img, index) => (
        <div
          key={`${img.url}-${index}`}
          className="w-full relative overflow-hidden bg-[#F9F8F6] cursor-zoom-in group"
          onClick={onMainImageClick}
        >
          <div className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] relative">
            <Image
              src={img.url}
              alt={img.altText || `Product image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
              sizes="(max-w-768px) 100vw, 60vw"
              priority={index < 2}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
