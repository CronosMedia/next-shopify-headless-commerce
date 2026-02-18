'use client'

import { useState } from 'react'
import { GalleryImage } from './Gallery'
import { Variant } from './BuyBox'
import Gallery from './Gallery'
import BuyBox from './BuyBox'
import Tabs from './Tabs'
import Breadcrumbs from '@/components/Breadcrumbs'
import RelatedProducts from '@/components/RelatedProducts'
import StickyBuyBox from '@/components/StickyBuyBox'
import RecentlyViewed from '@/components/RecentlyViewed'
import { useRecentlyViewed } from '@/lib/useRecentlyViewed'
import { useEffect } from 'react'

// Import Lightbox component (will create next)
import Lightbox from './Lightbox'

const DEFAULT_PLACEHOLDER_IMAGE: GalleryImage = {
  url: '/next.svg', // Using an existing SVG from public folder as a placeholder
  altText: 'Placeholder Image',
  width: 600,
  height: 600,
};

export default function ProductView({
  product,
  relatedProducts,
}: {
  product: any
  relatedProducts: any[]
}) {
  const images = (product.images?.edges ?? []).map((e: any) => e.node)
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

  const variants = (product.variants?.edges ?? []).map((e: any) => e.node)

  // Build breadcrumbs
  const collection = product.collections?.edges?.[0]?.node
  const breadcrumbItems = [{ name: 'Home', href: '/' }]
  if (collection) {
    breadcrumbItems.push({
      name: collection.title,
      href: `/collections/${collection.handle}`,
    })
  }
  breadcrumbItems.push({
    name: product.title,
    href: `/products/${product.handle}`,
  })

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
  }, [product.id])

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
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <Gallery
            key={mainImage.url}
            images={images}
            mainImage={mainImage}
            onThumbnailClick={(imageUrl: string) => {
              const clickedImage = images.find(
                (img: GalleryImage) => img.url === imageUrl
              )
              if (clickedImage) {
                setMainImage(clickedImage)
              }
            }}
            onMainImageClick={openLightbox}
          />
          <div id="main-buy-box">
            <BuyBox
              title={product.title}
              options={product.options}
              variants={variants}
              onVariantChange={handleVariantChange}
            />
          </div>
        </div>

        <div id="overview" className="max-w-4xl scroll-mt-24">
          <Tabs descriptionHtml={product.descriptionHtml} />
        </div>
      </main>

      <div id="recommended" className="scroll-mt-24">
        <RelatedProducts currentProductId={product.id} />
      </div>

      <RecentlyViewed currentProductId={product.id} />

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
