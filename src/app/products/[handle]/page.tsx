import { notFound } from 'next/navigation'
import {cache} from 'react'
import type {Metadata} from 'next'
import { shopifyClient } from '@/lib/shopify'
import {PRODUCT_BY_HANDLE_QUERY} from '@/lib/queries'
import ProductView, {type ProductViewProduct} from './ProductView'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  safeJsonLd,
  SITE_NAME,
  type JsonLdValue,
} from '@/lib/seo'

type ProductData = {
  product: ProductViewProduct | null
}

const getProduct = cache(async (handle: string) => {
  const {data} = await shopifyClient.request<ProductData>(
    PRODUCT_BY_HANDLE_QUERY,
    {
    handle,
    }
  )

  return data.product
})

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getProductDescription(product: ProductViewProduct) {
  return (
    product.description?.trim() ||
    stripHtml(product.descriptionHtml) ||
    `${product.title} de la ${SITE_NAME}.`
  )
}

function getProductImages(product: ProductViewProduct) {
  const images = product.images.edges
    .map(({node}) => node.url)
    .filter((url) => /^https?:\/\//i.test(url))

  if (images.length > 0) return images
  return product.featuredImage?.url ? [product.featuredImage.url] : []
}

function getProductJsonLd(product: ProductViewProduct): JsonLdValue {
  const productUrl = absoluteUrl(`/products/${product.handle}`)
  const variants = product.variants.edges.map(({node}) => node)
  const firstVariant = variants[0]
  const offers = variants
    .filter((variant) => variant.price?.amount)
    .map((variant) => ({
      '@type': 'Offer',
      url: productUrl,
      price: variant.price.amount,
      priceCurrency: 'RON',
      availability: variant.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      ...(variant.sku ? {sku: variant.sku} : {}),
    }))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: getProductDescription(product),
    image: getProductImages(product),
    url: productUrl,
    ...(product.vendor ? {brand: {'@type': 'Brand', name: product.vendor}} : {}),
    ...(firstVariant?.sku ? {sku: firstVariant.sku} : {}),
    offers:
      offers.length > 0
        ? offers
        : {
            '@type': 'Offer',
            url: productUrl,
            price: '0',
            priceCurrency: 'RON',
            availability: 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>
}): Promise<Metadata> {
  const {handle} = await params
  const product = await getProduct(handle)

  if (!product) {
    return {
      title: 'Produs indisponibil',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = getProductDescription(product)
  const image = product.featuredImage?.url
  const url = absoluteUrl(`/products/${product.handle}`)

  return {
    title: product.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: product.title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: image ? [{url: image, alt: product.featuredImage?.altText || product.title}] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    return notFound()
  }

  const collection = product.collections?.edges[0]?.node
  const breadcrumbItems = [
    {name: 'Home', path: '/'},
    {name: 'Colecții', path: '/collections'},
    ...(collection
      ? [{name: collection.title, path: `/collections/${collection.handle}`}]
      : []),
    {name: product.title, path: `/products/${product.handle}`},
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: safeJsonLd(getProductJsonLd(product))}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbJsonLd(breadcrumbItems)),
        }}
      />
      <ProductView product={product} />
    </>
  )
}
