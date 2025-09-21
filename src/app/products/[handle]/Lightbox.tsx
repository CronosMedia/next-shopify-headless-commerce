'use client'
import Image from 'next/image'
import { X } from 'lucide-react'
import { GalleryImage } from './Gallery'

type LightboxProps = {
  image: GalleryImage
  onClose: () => void
}

export default function Lightbox({ image, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="relative max-w-3xl max-h-full bg-white rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 z-10"
          aria-label="Close lightbox"
        >
          <X size={24} />
        </button>
        <Image
          src={image.url}
          alt={image.altText || 'Product image in lightbox'}
          width={1200} // Larger width for lightbox view
          height={1200} // Larger height for lightbox view
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}