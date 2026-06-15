import { shopifyClient } from '@/lib/shopify'
import {PRODUCTS_QUERY} from '@/lib/queries'
import Image from 'next/image'
import Link from 'next/link'
import {ArrowRight} from 'lucide-react'
import HeroSection from '@/components/HeroSection'
import TrendingCarousel from '@/components/TrendingCarousel'
import NewsletterSection from '@/components/NewsletterSection'

type ProductNode = {
  id: string
  handle: string
  title: string
  vendor?: string
  description: string
  featuredImage?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
  variants?: {
    edges: {
      node: {
        id: string
        availableForSale: boolean
      }
    }[]
  }
}

type ProductsData = {
  products: {
    edges: Array<{node: ProductNode}>
  }
}

async function getProducts(): Promise<ProductNode[]> {
  const {data} = await shopifyClient.request<ProductsData>(PRODUCTS_QUERY, {
    first: 12,
  })
  return data.products.edges.map(({node}) => node)
}

export default async function Home() {
  const products = await getProducts()
  const trendingProducts = products.slice(0, 8)

  return (
    <main className="bg-[var(--background)] -mt-24">

      {/* ════════════════════════════════════════════════════════════
          § 1 — HERO
          ════════════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ════════════════════════════════════════════════════════════
          § 2 — ASYMMETRIC EDITORIAL STORY
          ════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 md:py-32 lg:py-40">
        <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-32 items-stretch">
            {/* Left: Atmospheric Image Container */}
            <div className="lg:w-3/5 relative">
              <div className="aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/5] relative overflow-hidden">
                <Image
                  src="/images/hero/editorial-women.png"
                  alt="Maison Editorial"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Floating Product Callout */}
              <div className="absolute -bottom-10 -right-6 md:right-10 lg:-right-20 bg-[#F9F8F6] p-8 md:p-12 shadow-sm max-w-[280px] md:max-w-[320px]">
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#8a8a8a] mb-4 block">
                  New Arrival
                </span>
                <h3 className="text-lg md:text-xl font-light tracking-[0.05em] uppercase text-[#1a1a1a] mb-6">
                  Structured
                  <br />
                  <span className="font-normal italic">Silhouettes</span>
                </h3>
                <Link
                  href="/collections"
                  className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 hover:text-[#8a8a8a] hover:border-[#8a8a8a] transition-all duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Right: Refined Narrative Block */}
            <div className="lg:w-2/5 flex flex-col justify-center pt-12 lg:pt-0">
              <div className="max-w-md">
                <h2 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-[#1a1a1a] leading-[1.3] mb-10">
                  Minimalism
                  <br />
                  <span className="font-light">Reimagined</span>
                </h2>
                <div className="space-y-6">
                  <p className="text-[15px] font-normal leading-relaxed text-[#4a4a4a]">
                    This season, we explore the intersection of brutalist architecture and
                    soft tailoring. A collection that speaks in whispers but is heard
                    by everyone in the room.
                  </p>
                  <p className="text-[15px] font-normal leading-relaxed text-[#4a4a4a]">
                    Crafted from ethically sourced wool and organic silks, each piece
                    is a testament to our commitment to enduring luxury.
                  </p>
                </div>
                <div className="pt-12">
                  <Link
                    href="/collections"
                    className="group flex items-center gap-4 text-[11px] font-semibold tracking-[0.25em] uppercase text-[#1a1a1a]"
                  >
                    Explore the Edit
                    <div className="h-[1px] w-8 bg-[#1a1a1a] group-hover:w-16 transition-all duration-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          § 3 — TRENDING CAROUSEL
          ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-[var(--border)]">
        <div className="px-6 md:px-10 lg:px-16 mb-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--accent)] mb-3 block">
                What&apos;s Hot
              </span>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.08em] uppercase text-[var(--foreground)]">
                Trending Now
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden md:inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors group"
            >
              View All
              <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <TrendingCarousel products={trendingProducts} />
      </section>

      {/* ════════════════════════════════════════════════════════════
          § 4 — EDITORIAL CAMPAIGN
          ════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 md:py-32 lg:py-48 px-6 md:px-10 lg:px-24 border-t border-[#f0efed]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-end">
            <div className="lg:col-span-8 relative overflow-hidden group">
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image
                  src="/images/hero/campaign-winter.jpg"
                  alt="Maison Campaign"
                  fill
                  className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                />
              </div>
            </div>
            <div className="lg:col-span-4 pb-0 lg:pb-12">
              <div className="max-w-xs">
                <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-[#8a8a8a] mb-6 block">
                  Edition 01
                </span>
                <h2 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-[#1a1a1a] mb-8 leading-tight">
                  Winter
                  <br />
                  <span className="font-light italic">Solstice</span>
                </h2>
                <p className="text-[14px] font-normal leading-relaxed text-[#4a4a4a] mb-10">
                  A visual exploration of silence and structure. Captured in the high
                  altitudes of the north, our first limited edition capsule.
                </p>
                <Link
                  href="/collections"
                  className="group flex items-center gap-4 text-[11px] font-semibold tracking-[0.3em] uppercase text-[#1a1a1a]"
                >
                  Explore Sequence
                  <div className="h-[1px] w-8 bg-[#1a1a1a] group-hover:w-16 transition-all duration-700" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          § 5 — BRAND MANIFESTO
          ════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F9F8F6] py-32 md:py-48 lg:py-64">
        <div className="max-w-3xl mx-auto text-center px-6">
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-light tracking-[0.4em] uppercase text-[#1a1a1a]">
              Maison
            </h2>
          </div>
          <p className="text-lg md:text-2xl font-light leading-relaxed text-[#4a4a4a] mb-12 italic">
            &quot;Luxury is not about abundance, but the presence of meaning
            in every thread, and the silence of quality in every room.&quot;
          </p>
          <div className="w-12 h-[1px] bg-[#1a1a1a] mx-auto mb-12" />
          <p className="text-[13px] font-normal leading-relaxed text-[#8a8a8a] tracking-wide uppercase max-w-xl mx-auto">
            Hand-curated in London. Sustained by tradition.
            Defined by the future of craftsmanship.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          § 6 — NEWSLETTER
          ════════════════════════════════════════════════════════════ */}
      <NewsletterSection />

    </main>
  )
}
