import { shopifyClient } from '@/lib/shopify'
import {PRODUCTS_QUERY} from '@/lib/queries'
import Image from 'next/image'
import Link from 'next/link'
import {ArrowRight} from 'lucide-react'
import HeroSection from '@/components/HeroSection'
import TrendingCarousel from '@/components/TrendingCarousel'
import NewsletterSection from '@/components/NewsletterSection'
import {defaultMetadata, itemListJsonLd, safeJsonLd} from '@/lib/seo'

export const metadata = defaultMetadata('Maison Outdoor')

type ProductNode = {
  id: string
  handle: string
  title: string
  vendor?: string
  productType?: string
  description: string
  featuredImage?: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }
  options?: Array<{ name: string; values: string[] }>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            itemListJsonLd(
              trendingProducts.map((product) => ({
                name: product.title,
                path: `/products/${product.handle}`,
              }))
            )
          ),
        }}
      />

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
                  src="/images/hero/editorial-outdoor.png"
                  alt="Maison Outdoor Technical Gear"
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
              {/* Floating Product Callout */}
              <div className="relative mx-auto -mt-10 lg:mt-0 lg:absolute lg:mx-0 lg:-bottom-10 lg:-right-20 bg-[#F9F8F6] p-8 lg:p-12 shadow-sm max-w-[280px] lg:max-w-[320px] z-10 text-center lg:text-left flex flex-col items-center lg:items-start">
                <span className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-[#8a8a8a] mb-4 block">
                  DETALII TEHNICE
                </span>
                <h3 className="text-lg md:text-xl font-light tracking-[0.05em] uppercase text-[#1a1a1a] mb-6">
                  Creat pentru
                  <br />
                  <span className="font-semibold">înălțimi</span>
                </h3>
                <Link
                  href="/collections"
                  className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 hover:text-[#8a8a8a] hover:border-[#8a8a8a] transition-all duration-300 justify-center lg:justify-start"
                >
                  Vezi detalii
                </Link>
              </div>
            </div>

            {/* Right: Refined Narrative Block */}
            <div className="lg:w-2/5 flex flex-col justify-center pt-12 lg:pt-0 items-center lg:items-start text-center lg:text-left">
              <div className="max-w-xl lg:max-w-md">
                <h2 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-[#1a1a1a] leading-[1.3] mb-10">
                  Explorează
                  <br />
                  <span className="font-light">Fără Limite</span>
                </h2>
                <div className="space-y-6">
                  <p className="text-base md:text-lg font-medium leading-relaxed text-[#4a4a4a]">
                    Selecționăm echipamente premium care stau între tine și elementele naturii. De la jachete rezistente la vânt pentru altitudini mari până la piese ultra-ușoare și pliabile, fiecare produs este ales pentru a-ți susține căutarea necunoscutului.
                  </p>
                  <p className="text-base md:text-lg font-medium leading-relaxed text-[#4a4a4a]">
                    Realizate din materiale durabile, rezistente și având un design ergonomic, produsele din portofoliul nostru îți oferă libertatea de a explora mai departe și de a te odihni mai profund.
                  </p>
                </div>
                <div className="pt-12">
                  <Link
                    href="/collections"
                    className="group flex items-center gap-4 text-xs md:text-sm font-bold tracking-[0.25em] uppercase text-[#1a1a1a] justify-center lg:justify-start"
                  >
                    Explorează selecția
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
              <span className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[var(--accent)] mb-3 block">
                Ce se poartă
              </span>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.08em] uppercase text-[var(--foreground)]">
                În tendințe acum
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden md:inline-flex items-center gap-2 text-xs md:text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors group"
            >
              Vezi toate
              <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <TrendingCarousel products={trendingProducts} />
      </section>

      {/* ════════════════════════════════════════════════════════════
          § 4 — EDITORIAL CAMPAIGN
          ════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 md:py-32 lg:py-48 px-6 md:px-10 lg:px-12 xl:px-24 border-t border-[#f0efed]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 xl:gap-24 items-end">
            <div className="lg:col-span-7 xl:col-span-8 relative overflow-hidden group">
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image
                  src="/images/hero/campaign-outdoor.jpg"
                  alt="Maison Outdoor Campaign - Friends hiking on trail at sunset"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                />
              </div>
            </div>
            <div className="lg:col-span-5 xl:col-span-4 pb-0 lg:pb-12 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
              <div className="max-w-xl lg:max-w-xs">
                <span className="text-xs md:text-sm font-semibold tracking-[0.4em] uppercase text-[#8a8a8a] mb-6 block">
                  SERIA EXPEDIȚII
                </span>
                <h2 className="text-3xl md:text-4xl font-extralight tracking-[0.1em] uppercase text-[#1a1a1a] mb-8 leading-tight">
                  Evadarea
                  <br />
                  <span className="font-semibold">Alpină</span>
                </h2>
                <p className="text-base md:text-lg font-medium leading-relaxed text-[#4a4a4a] mb-10">
                  O explorare vizuală a sălbăticiei și a camaraderiei. Surprins la altitudinile mari ale vârfurilor abrupte, echipamentul tehnic pe care îl oferim este conceput pentru a face locurile izolate să se simtă ca acasă.
                </p>
                <Link
                  href="/collections"
                  className="group flex items-center gap-4 text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-[#1a1a1a] justify-center lg:justify-start"
                >
                  Explorează campania
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
      <section className="relative overflow-hidden bg-[#151515] text-white py-16 md:py-24 lg:py-28">
        {/* Background Image with dark overlay (Hero Style) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <Image
            src="/images/hero/manifesto-bg.png"
            alt="Maison Outdoor brand manifesto background"
            fill
            className="object-cover"
            sizes="100vw"
            quality={75}
          />
          {/* Dark Overlay similar to Hero Section */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 md:px-10">
          <div className="mb-8">
            <span className="text-xs md:text-sm font-semibold tracking-[0.4em] uppercase text-white/80 mb-4 block [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]">
              Maison Outdoor
            </span>
          </div>
          <h3 className="text-xl md:text-3xl font-light leading-relaxed text-white tracking-wide mb-10 max-w-3xl mx-auto [text-shadow:_0_2px_8px_rgba(0,0,0,0.4)]">
            &quot;Adevăratul lux nu constă în exces, ci în libertatea de a explora, în susurul liniștit al vântului de munte și în încrederea deplină în echipamentul pe care îl porți.&quot;
          </h3>
          <div className="w-16 h-[1px] bg-white/30 mx-auto mb-10" />
          <p className="text-xs md:text-sm font-normal leading-loose md:leading-relaxed text-white/90 tracking-[0.14em] md:tracking-[0.18em] uppercase max-w-2xl mx-auto [text-shadow:_0_1px_4px_rgba(0,0,0,0.3)]">
            Echipamente premium de la branduri de top. Testate în munți.
            <br className="hidden sm:inline" />
             Selectate pentru cei care caută poteca deschisă.
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
