'use client'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { ShoppingCart } from 'lucide-react'
import MegaMenu from './MegaMenu'

export default function Navbar() {
  const { cart } = useCart()
  const count = cart?.totalQuantity || 0
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold"
          style={{ color: 'var(--brand-green)' }}
        >
          next-commerce
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {/* Server component via RSC boundary */}
          <MegaMenu />
          <Link href="/cart" className="relative flex items-center gap-1">
            <ShoppingCart size={18} /> Cart
            {count > 0 ? (
              <span
                className="ml-1 inline-flex items-center justify-center rounded-full text-white text-xs px-2 h-5"
                style={{ background: 'var(--brand-green)' }}
              >
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  )
}
