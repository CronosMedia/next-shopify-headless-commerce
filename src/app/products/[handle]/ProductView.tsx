'use client'

import {useEffect, useMemo, useState} from 'react'
import { GalleryImage } from './Gallery'
import { Variant } from './BuyBox'
import Gallery from './Gallery'
import BuyBox from './BuyBox'
import Tabs from './Tabs'
import RelatedProducts from '@/components/RelatedProducts'
import StickyBuyBox from '@/components/StickyBuyBox'
import { useRecentlyViewed } from '@/lib/useRecentlyViewed'

// Import Lightbox component (will create next)
import Lightbox from './Lightbox'

const DEFAULT_PLACEHOLDER_IMAGE: GalleryImage = {
  url: '/next.svg', // Using an existing SVG from public folder as a placeholder
  altText: 'Placeholder Image',
  width: 600,
  height: 600,
};

export type ProductViewProduct = {
  id: string
  handle: string
  title: string
  vendor?: string
  description?: string
  descriptionHtml: string
  featuredImage: GalleryImage | null
  images: {
    edges: Array<{node: GalleryImage}>
  }
  collections?: {
    edges: Array<{node: {title: string; handle: string}}>
  }
  options: Array<{name: string; values: string[]}>
  variants: {
    edges: Array<{node: Variant}>
  }
}

export default function ProductView({
  product,
}: {
  product: ProductViewProduct
}) {
  const images = useMemo(
    () => product.images.edges.map(({node}) => node),
    [product.images.edges]
  )
  const [mainImage, setMainImage] = useState<GalleryImage>(
    images[0] || product.featuredImage || DEFAULT_PLACEHOLDER_IMAGE
  )
  const [showLightbox, setShowLightbox] = useState(false) // New state for lightbox

  const handleVariantChange = (variant: Variant) => {
    if (variant.image) {
      setMainImage(variant.image)
    }
  }

  const openLightbox = () => setShowLightbox(true) // Function to open lightbox
  const closeLightbox = () => setShowLightbox(false) // Function to close lightbox

  const variants = useMemo(
    () => product.variants.edges.map(({node}) => node),
    [product.variants.edges]
  )

  const { addProduct } = useRecentlyViewed()
  const [isStickyVisible, setIsStickyVisible] = useState(false)

  const firstVariant = variants[0]
  const price = firstVariant?.price?.amount || '0'
  const currency = firstVariant?.price?.currencyCode || 'USD'
  const availableForSale = firstVariant?.availableForSale || false

  useEffect(() => {
    if (product) {
      addProduct({
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage || images[0] || null,
        price,
        currencyCode: currency
      })
    }
  }, [addProduct, currency, images, price, product])

  // Intersection Observer to toggle sticky header
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle visibility: true when BuyBox is NOT intersecting (scrolled past), false otherwise
        // Actually we want it visible when we scroll PAST the buy button.
        // Let's attach ref to the BuyBox container.
        setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0 }
    )

    const buyBoxElement = document.getElementById('main-buy-box')
    if (buyBoxElement) {
      observer.observe(buyBoxElement)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <main className="max-w-360 mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-24">
        {/* Top Section: Gallery + BuyBox (Non-Sticky Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 lg:items-start pb-16 md:pb-24">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-1">
            <Gallery
              images={images}
              mainImage={mainImage}
              onThumbnailClick={(img) => setMainImage(img)}
              onMainImageClick={openLightbox}
            />
          </div>

          {/* Right Column: BuyBox Details */}
          <div className="lg:col-span-1">
            <div id="main-buy-box">
              <BuyBox
                title={product.title}
                handle={product.handle}
                options={product.options}
                variants={variants}
                onVariantChange={handleVariantChange}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Details & Tabs (Full Width Below Gallery + BuyBox) */}
        <div id="overview" className="border-t border-[#f0efed] pt-12 md:pt-16">
          <Tabs descriptionHtml={product.descriptionHtml} />
        </div>
      </main>

      <div id="recommended" className="bg-[#F9F8F6] py-24 md:py-32">
        <RelatedProducts currentProductId={product.id} />
      </div>

      <StickyBuyBox
        product={{
          title: product.title,
          price: Number(price).toFixed(2),
          currency,
          availableForSale,
          featuredImage: product.featuredImage || images[0] || null
        }}
        variantId={firstVariant?.id}
        isVisible={isStickyVisible}
      />

      {/* Lightbox component */}
      {showLightbox && <Lightbox image={mainImage} onClose={closeLightbox} />}
    </>
  )
}
