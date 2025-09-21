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
  onThumbnailClick: (imageUrl: string) => void
  onMainImageClick: () => void
}) {
  return (
    <div className="space-y-3">
      <div
        className="aspect-square w-full rounded border relative overflow-hidden"
        onClick={onMainImageClick} // Added onClick
      >
        <Image
          key={mainImage.url}
          src={mainImage.url}
          alt={mainImage.altText || 'Product image'}
          width={1000}
          height={1000}
          className="w-full h-auto object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img) => (
            <button
              key={img.url}
              className={`relative aspect-square rounded border overflow-hidden ${
                img.url === mainImage.url
                  ? 'ring-2 ring-offset-2 ring-green-600'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
              onClick={() => onThumbnailClick(img.url)}
              aria-label={`View image of ${img.altText || 'product'}`}
            >
              <Image
                src={img.url}
                alt={img.altText || 'Thumbnail'}
                width={300}
                height={300}
                className="w-full h-auto object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
