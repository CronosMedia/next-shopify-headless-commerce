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
  mainImage,
  onThumbnailClick,
  onMainImageClick,
}: {
  images: GalleryImage[]
  mainImage: GalleryImage
  onThumbnailClick: (image: GalleryImage) => void
  onMainImageClick: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        className="w-full relative overflow-hidden bg-[#F9F8F6] cursor-zoom-in group border border-[var(--border)]"
        onClick={onMainImageClick}
      >
        <div className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] relative">
          <Image
            src={mainImage.url}
            alt={mainImage.altText || 'Imagine principală produs'}
            fill
            className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-102"
            sizes="(max-w-768px) 100vw, 60vw"
            priority
          />
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 md:gap-3">
          {images.map((img, index) => {
            const isActive = img.url === mainImage.url
            return (
              <button
                key={`${img.url}-${index}`}
                type="button"
                onClick={() => onThumbnailClick(img)}
                className={`w-16 h-20 md:w-20 md:h-24 relative overflow-hidden bg-[#F9F8F6] transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'border-black opacity-100 scale-98'
                    : 'border-[var(--border)] opacity-60 hover:opacity-100 hover:border-neutral-400'
                }`}
                aria-label={`Vezi imaginea ${index + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `Miniatură ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-w-768px) 80px, 120px"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
