import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Inter, Cormorant_Garamond, Barlow } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import { UIProvider } from '@/components/UIProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { WishlistProvider } from '@/components/WishlistProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import QuickViewModal from '@/components/QuickViewModal'
import SmoothScroll from '@/components/SmoothScroll'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  style: ['normal', 'italic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Common weights for body text
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Next Commerce',
    default: 'Next Commerce',
  },
  description:
    'A modern, performant, and user-friendly e-commerce storefront built with Next.js.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
      >
        <SmoothScroll>
          <AuthProvider>
            <UIProvider>
              <CartProvider>
                <WishlistProvider>
                  <Header />
                  <main className="min-h-screen pt-24">{children}</main>
                  <QuickViewModal />
                  <Footer />
                </WishlistProvider>
              </CartProvider>
            </UIProvider>
          </AuthProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
