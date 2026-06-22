import { Geist_Mono } from 'next/font/google'
import { Geist, Inter, Cormorant_Garamond, Barlow } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import { UIProvider } from '@/components/UIProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { WishlistProvider } from '@/components/WishlistProvider'
import SiteChrome from '@/components/SiteChrome'

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
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    template: '%s | Maison Outdoor',
    default: 'Maison Outdoor',
  },
  description:
    'Maison Outdoor - Echipament tehnic și îmbrăcăminte premium pentru expediții și drumeții.',
}

import { ToastProvider } from '@/components/ToastProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${geist.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
        suppressHydrationWarning
      >
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
