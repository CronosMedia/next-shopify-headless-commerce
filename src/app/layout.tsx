import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Barlow } from 'next/font/google' // Add this line
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import { UIProvider } from '@/components/UIProvider'
import { AuthProvider } from '@/components/AuthProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import QuickViewModal from '@/components/QuickViewModal'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
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
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
      >
        <AuthProvider>
          <UIProvider>
            <CartProvider>
              <Header />
              <main className="min-h-screen pt-24">{children}</main>
              <QuickViewModal />
              <Footer />
            </CartProvider>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
