'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
} from 'lucide-react'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import MegaMenu from './MegaMenu'
import Cart from './Cart'

type Product = {
  id: string
  handle: string
  title: string
  featuredImage: {
    url: string
    altText: string
    width: number
    height: number
  } | null
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
}

export default function MainHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveSearchResults, setLiveSearchResults] = useState<Product[]>([])
  const [liveSearchLoading, setLiveSearchLoading] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const { cart } = useCart()
  const { count: wishlistCount } = useWishlist()
  const count = cart?.totalQuantity || 0
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 60)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isTransparent = isHome && isAtTop && !searchOpen && !mobileMenuOpen
  const textColor = isTransparent ? 'text-white' : 'text-[var(--foreground)]'
  const mutedColor = isTransparent ? 'text-white/60' : 'text-[var(--muted-foreground)]'
  const hoverColor = isTransparent ? 'hover:text-white' : 'hover:text-[var(--accent)]'
  const badgeBg = isTransparent ? 'bg-white text-[var(--foreground)]' : 'bg-[var(--accent)] text-white'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setLiveSearchResults([])
      setSearchOpen(false)
      setMobileMenuOpen(false)
    }
  }

  // Debounce effect for live search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveSearchResults([])
      setLiveSearchLoading(false)
      return
    }

    setLiveSearchLoading(true)
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
        )
        const data = await response.json()
        if (response.ok) {
          setLiveSearchResults(data.products)
        } else {
          setLiveSearchResults([])
        }
      } catch {
        setLiveSearchResults([])
      } finally {
        setLiveSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${isTransparent ? 'bg-black/15 backdrop-blur-md border-b border-white/10' : 'bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm'}`}>
      <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16">
        {/* Main Row */}
        <div className="flex items-center justify-between h-[72px]">

          {/* Left: Mobile menu + Nav */}
          <div className="flex items-center gap-10">
            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-1 ${textColor}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <MegaMenu title="Shop" align="left" />
              <MegaMenu title="Bestsellers" align="left" />
              <Link
                href="/collections"
                className={`text-[13px] font-normal tracking-[0.08em] uppercase ${mutedColor} ${hoverColor} transition-colors duration-300`}
              >
                Collections
              </Link>
              <Link
                href="/noutati"
                className={`text-[13px] font-normal tracking-[0.08em] uppercase ${mutedColor} ${hoverColor} transition-colors duration-300`}
              >
                New In
              </Link>
            </nav>
          </div>

          {/* Center: Logo / Wordmark */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className={`text-xl md:text-2xl font-light tracking-[0.25em] uppercase ${textColor} transition-colors duration-500`}>
              MAISON
            </h1>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-5">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`${textColor} ${hoverColor} transition-colors`}
              title="Search"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {/* Account */}
            <Link
              href="/account"
              className={`hidden sm:block ${textColor} ${hoverColor} transition-colors`}
              title="Account"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className={`hidden sm:block ${textColor} ${hoverColor} transition-colors relative`}
              title="Wishlist"
            >
              <Heart size={20} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 ${badgeBg} rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-medium`}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag */}
            <Link
              href="/cart"
              className={`${textColor} ${hoverColor} transition-colors relative`}
              title="Shopping Bag"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 ${badgeBg} rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-medium`}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Expandable Search */}
      {searchOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)]">
          <div className="max-w-2xl mx-auto px-6 py-5">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-12 bg-transparent text-[var(--foreground)] text-base font-light tracking-wide border-b border-[var(--muted)] focus:border-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] placeholder:font-light placeholder:tracking-wider"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </form>

            {/* Live Search Results */}
            {searchQuery.trim().length >= 2 && liveSearchLoading && (
              <div className="py-4 text-center text-xs tracking-wider uppercase text-[var(--muted-foreground)]">
                Searching...
              </div>
            )}
            {searchQuery.trim().length >= 2 && !liveSearchLoading && liveSearchResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto">
                {liveSearchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="flex items-center gap-4 py-3 border-b border-[var(--secondary)] hover:bg-[var(--secondary)] transition-colors px-2 -mx-2"
                    onClick={() => { setLiveSearchResults([]); setSearchQuery(''); setSearchOpen(false) }}
                  >
                    {product.featuredImage?.url && (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-normal text-[var(--foreground)] tracking-wide">{product.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        £{Number(product.priceRange.minVariantPrice.amount).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {searchQuery.trim().length >= 2 && !liveSearchLoading && liveSearchResults.length === 0 && (
              <div className="py-4 text-center text-xs tracking-wider text-[var(--muted-foreground)]">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <div className="px-6 py-6 space-y-5">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-transparent text-[var(--foreground)] text-sm border-b border-[var(--muted)] focus:border-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              >
                <Search size={16} strokeWidth={1.5} />
              </button>
            </form>
            <Link href="/account" className="flex items-center gap-3 text-[var(--foreground)] text-sm tracking-wide">
              <User size={18} strokeWidth={1.5} />
              <span>Account</span>
            </Link>
            <div className="border-t border-[var(--border)] pt-5 space-y-3">
              <Link href="/" className="block py-1.5 text-sm tracking-[0.08em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Home</Link>
              <Link href="/collections" className="block py-1.5 text-sm tracking-[0.08em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Collections</Link>
              <Link href="/noutati" className="block py-1.5 text-sm tracking-[0.08em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)]">New In</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
