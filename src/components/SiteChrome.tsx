'use client'

import {usePathname} from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import QuickViewModal from '@/components/QuickViewModal'

export default function SiteChrome({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin')
  const isInvoiceRoute = pathname.startsWith('/invoice')

  if (isAdminRoute || isInvoiceRoute) {
    return children
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <QuickViewModal />
      <Footer />
      <MobileBottomNav />
    </>
  )
}
