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
import { formatMoney } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/useScrollDirection'

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
  
  const { cart } = useCart()
  const { count: wishlistCount } = useWishlist()
  const count = cart?.totalQuantity || 0
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'
  
  const { scrollDirection, isTop } = useScrollDirection()

  useEffect(() => {
    const handleTriggerSearch = () => {
      setSearchOpen(true)
    }
    window.addEventListener('trigger-search', handleTriggerSearch)
    return () => window.removeEventListener('trigger-search', handleTriggerSearch)
  }, [])

  // Close overlays on navigation and control scroll lock
  useEffect(() => {
    setMobileMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, searchOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    if (searchOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [searchOpen])

  const isTransparent = isHome && isTop && !searchOpen && !mobileMenuOpen
  const isHeaderVisible = scrollDirection === 'up' || isTop || mobileMenuOpen || searchOpen

  const textColor = isTransparent ? 'text-white' : 'text-[var(--foreground)]'
  const mutedColor = isTransparent ? 'text-white/80' : 'text-[var(--muted-foreground)]'
  const hoverColor = isTransparent ? 'hover:text-white' : 'hover:text-black'
  const badgeBg = isTransparent ? 'bg-white text-black' : 'bg-[var(--foreground)] text-[var(--background)]'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setLiveSearchResults([])
      setSearchOpen(false)
    }
  }

  // Live Search Query with Debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveSearchResults([])
      setLiveSearchLoading(false)
      return
    }

    setLiveSearchLoading(true)
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) {
          const data = await res.json()
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
    <>
      <header className={`fixed top-0 z-50 w-full pt-[env(safe-area-inset-top)] transition-transform duration-300 transform ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'} ${isTransparent ? 'bg-black/30 lg:bg-black/15 lg:backdrop-blur-md border-b border-white/10' : 'bg-[var(--background)] lg:bg-[var(--background)]/95 lg:backdrop-blur-md border-b border-[var(--border)] shadow-sm'}`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
          {/* Main Row — Flex Layout */}
          <div className="flex items-center justify-between h-[60px] lg:h-[72px] relative">
            
            {/* Col 1 — Left: Desktop nav */}
            <div className="hidden lg:flex items-center gap-10">
              <nav className="flex items-center gap-8">
                <MegaMenu
                  title="Magazin"
                  align="left"
                  className={`flex items-center gap-1 text-sm font-semibold tracking-[0.15em] uppercase cursor-pointer transition-colors duration-300 ${mutedColor} ${hoverColor}`}
                />
                <MegaMenu
                  title="Cele mai vândute"
                  align="left"
                  className={`flex items-center gap-1 text-sm font-semibold tracking-[0.15em] uppercase cursor-pointer transition-colors duration-300 ${mutedColor} ${hoverColor}`}
                />
                <Link
                  href="/collections"
                  className={`text-sm font-semibold tracking-[0.15em] uppercase ${mutedColor} ${hoverColor} transition-colors duration-300`}
                >
                  Categorii
                </Link>
                <Link
                  href="/noutati"
                  className={`text-sm font-semibold tracking-[0.15em] uppercase ${mutedColor} ${hoverColor} transition-colors duration-300`}
                >
                  Noutăți
                </Link>
              </nav>
            </div>
            <div className="lg:hidden flex-1" />
 
            {/* Col 2 — Logo (Left on mobile, Centered on desktop) */}
            <div className="absolute left-0 lg:left-1/2 top-1/2 -translate-y-1/2 lg:-translate-x-1/2 pointer-events-none flex justify-start lg:justify-center items-center w-auto lg:w-full">
              <Link href="/" className="pointer-events-auto flex items-center justify-start lg:justify-center">
                <h1 className={`text-[15px] sm:text-lg md:text-xl lg:text-2xl font-light tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.22em] lg:tracking-[0.25em] uppercase whitespace-nowrap ${textColor} transition-colors duration-500`}>
                  MAISON OUTDOOR
                </h1>
              </Link>
            </div>
 
            {/* Col 3 — Right: Actions (Desktop) + Hamburger (Mobile) */}
            <div className="flex items-center gap-2 sm:gap-5 justify-end relative z-10">
              {/* Search Trigger */}
              <button
                onClick={() => {
                  setSearchOpen(prev => !prev)
                  setMobileMenuOpen(false)
                }}
                className={`hidden lg:block ${textColor} ${hoverColor} transition-colors cursor-pointer`}
                aria-label="Căutare"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>
 
              {/* User Account */}
              <Link
                href="/account"
                className={`hidden lg:block ${textColor} ${hoverColor} transition-colors`}
                title="Contul Meu"
              >
                <User size={20} strokeWidth={1.5} />
              </Link>
 
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className={`hidden lg:block ${textColor} ${hoverColor} transition-colors relative`}
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
                className={`hidden lg:block ${textColor} ${hoverColor} transition-colors relative`}
                title="Shopping Bag"
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 ${badgeBg} rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-medium`}>
                    {count}
                  </span>
                )}
              </Link>
 
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer active:opacity-70 relative z-[100]"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Meniu"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                {mobileMenuOpen ? <X size={28} strokeWidth={1.5} className={`${textColor} pointer-events-none`} /> : <Menu size={28} strokeWidth={1.5} className={`${textColor} pointer-events-none`} />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-[60px] h-[calc(100vh-60px)] supports-[height:100dvh]:h-[calc(100dvh-60px)] z-40 bg-[var(--background)] overflow-y-auto border-t border-[var(--border)]">
            <div className="px-6 py-8 space-y-6 pb-24">
              
              <div className="flex flex-col gap-4 pt-2">
                <Link href="/" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Acasă
                </Link>
                <Link href="/collections" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Categorii
                </Link>
                <Link href="/noutati" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Noutăți
                </Link>
                <Link href="/despre-noi" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Despre Noi
                </Link>
                <Link href="/contact" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                <Link href="/help-center" className="text-sm tracking-[0.08em] uppercase font-normal text-[var(--foreground)] hover:text-black transition-colors py-2.5 border-b border-[var(--border)]" onClick={() => setMobileMenuOpen(false)}>
                  Centru de Ajutor
                </Link>
              </div>
              
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-xs animate-in fade-in duration-300"
          onClick={() => {
            setMobileMenuOpen(false)
          }}
        />
      )}

      {/* Search Modal (CSOV Style) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 lg:pt-24 px-4 animate-in fade-in duration-200">
          {/* Clickable Backdrop */}
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black/45 backdrop-blur-xs cursor-default animate-in fade-in duration-200"
            onClick={() => {
              setSearchOpen(false)
              setSearchQuery('')
            }}
            aria-label="Închide căutarea"
          />
          {/* Centered Modal Card */}
          <div className="relative w-full max-w-2xl bg-white rounded-none border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] z-10 animate-in zoom-in-95 duration-200">
            {/* Header / Input */}
            <div className="p-4 lg:p-5 border-b border-[var(--border)] shrink-0 bg-white">
              <form onSubmit={handleSearch} className="relative flex items-center w-full">
                <Search className="absolute left-4 text-[var(--muted-foreground)]" size={18} strokeWidth={1.5} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Caută produse, colecții..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim() && liveSearchResults.length > 0) {
                      router.push(`/products/${liveSearchResults[0].handle}`)
                      setSearchOpen(false)
                      setSearchQuery('')
                      setLiveSearchResults([])
                      e.preventDefault()
                    }
                  }}
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-none py-3.5 pl-11 pr-24 text-sm font-normal text-black placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-black focus:bg-white focus:shadow-sm transition-all"
                />
                <div className="absolute right-4 flex items-center gap-2">
                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setLiveSearchResults([])
                      }}
                      className="text-[var(--muted-foreground)] hover:text-black transition-colors cursor-pointer p-1"
                      aria-label="Resetează căutarea"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  )}
                  <span className="hidden sm:inline-block text-[9px] font-semibold text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 border border-[var(--border)] tracking-widest uppercase rounded-none">Esc</span>
                </div>
              </form>
            </div>

            {/* Results / Suggestions Scrollable Container */}
            <div className="p-5 overflow-y-auto bg-white flex-1 custom-scrollbar max-h-[50vh]">
              {searchQuery.trim().length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase mb-4">Căutări sugerate</p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {['Cort', 'Rucsac', 'Geacă', 'Termos', 'Lanternă'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs bg-black text-white hover:bg-black/80 transition-colors duration-200 px-4 py-2 rounded-none uppercase tracking-wider font-semibold cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {liveSearchLoading ? (
                    <div className="py-8 text-center text-xs tracking-wider uppercase text-[var(--muted-foreground)] animate-pulse">
                      Se caută...
                    </div>
                  ) : liveSearchResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] px-2 mb-1">Rezultate Sugerate</h4>
                      <div className="flex flex-col gap-1.5">
                        {liveSearchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.handle}`}
                            className="flex items-center gap-3.5 py-2 px-3 hover:bg-[var(--secondary)] rounded-none border border-transparent hover:border-[var(--border)] transition-all group"
                            onClick={() => { setLiveSearchResults([]); setSearchQuery(''); setSearchOpen(false) }}
                          >
                            {product.featuredImage?.url ? (
                              <div className="relative w-10 h-10 flex-shrink-0 bg-[var(--secondary)] rounded-none overflow-hidden">
                                <Image
                                  src={product.featuredImage.url}
                                  alt={product.featuredImage.altText || product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 flex-shrink-0 bg-[var(--secondary)] rounded-none flex items-center justify-center text-[var(--muted-foreground)]">
                                <Search size={14} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-black group-hover:text-black transition-colors truncate">{product.title}</p>
                              <p className="text-xs text-[var(--muted-foreground)] font-light mt-0.5">
                                {formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs tracking-wider text-[var(--muted-foreground)]">
                      Nu s-au găsit rezultate pentru &quot;{searchQuery}&quot;.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
