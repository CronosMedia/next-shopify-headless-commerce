import { Geist_Mono } from 'next/font/google'
import { Geist, Inter, Cormorant_Garamond, Barlow } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import { UIProvider } from '@/components/UIProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { WishlistProvider } from '@/components/WishlistProvider'
import SiteChrome from '@/components/SiteChrome'
import {ToastProvider} from '@/components/ToastProvider'
import type {Metadata, Viewport} from 'next'
import {
  absoluteUrl,
  getSiteUrl,
  safeJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/seo'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  style: ['normal', 'italic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
})

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin', 'latin-ext'],
})

const barlow = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'], // Common weights for body text
  variable: '--font-barlow',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: SITE_NAME,
    url: getSiteUrl(),
  }
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="ro" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${geist.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: safeJsonLd(organizationJsonLd)}}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: safeJsonLd(websiteJsonLd)}}
        />
        <AuthProvider>
          <ToastProvider>
            <UIProvider>
              <CartProvider>
                <WishlistProvider>
                  <SiteChrome>{children}</SiteChrome>
                </WishlistProvider>
              </CartProvider>
            </UIProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
