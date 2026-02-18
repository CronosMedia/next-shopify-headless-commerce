'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart, // Import Heart for Wishlist
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveSearchResults, setLiveSearchResults] = useState<Product[]>([])
  const [liveSearchLoading, setLiveSearchLoading] = useState(false)
  const { cart } = useCart()
  const { count: wishlistCount } = useWishlist()
  const count = cart?.totalQuantity || 0
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('') // Reset search query
      setLiveSearchResults([]) // Clear live results on full search
      setMobileMenuOpen(false) // Close mobile menu after search
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
          console.error('Live search API error:', data.error?.message)
          setLiveSearchResults([])
        }
      } catch (error) {
        console.error('Live search fetch error:', error)
        setLiveSearchResults([])
      } finally {
        setLiveSearchLoading(false)
      }
    }, 300) // 300ms debounce delay

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full mx-auto px-4 py-3 justify-between">
      <div className="max-w-full mx-auto px-4">
        {/* Top Row */}
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            {/* Logo */}
            <div className="mr-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">PS</span>
                </div>
                {/* Removed text span */}
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 py-3">
              <MegaMenu title="Magazin" align="left" />
              <MegaMenu title="Cele mai vândute" align="left" />
              <Link
                href="/oferte"
                className="font-barlow text-base font-normal text-gray-700 leading-normal cursor-pointer hover:text-black"
              >
                Oferte
              </Link>
              <Link
                href="/noutati"
                className="font-barlow text-base font-normal text-gray-700 leading-normal cursor-pointer hover:text-black"
              >
                Noutăți
              </Link>
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div className="flex-1 mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search
                size={24}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cautare produse..." // Translated placeholder
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-28 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base font-barlow"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-gray-700 text-white rounded-r-lg text-base font-barlow font-semibold leading-normal hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cautare
              </button>
              {searchQuery.trim().length >= 2 && liveSearchLoading && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 p-2 text-center text-sm text-gray-500">
                  Searching...
                </div>
              )}
              {searchQuery.trim().length >= 2 &&
                !liveSearchLoading &&
                liveSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {liveSearchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.handle}`}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 border-b last:border-b-0"
                        onClick={() => {
                          setLiveSearchResults([])
                          setSearchQuery('')
                        }}
                      >
                        {product.featuredImage?.url && (
                          <Image
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText || product.title}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.priceRange.minVariantPrice.amount}{' '}
                            {product.priceRange.minVariantPrice.currencyCode}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              {searchQuery.trim().length >= 2 &&
                !liveSearchLoading &&
                liveSearchResults.length === 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 p-2 text-center text-sm text-gray-500">
                    No results found.
                  </div>
                )}
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Account */}
            <Link
              href="/account"
              className="hidden sm:flex flex-col items-center text-gray-700 hover:text-black"
            >
              <User size={24} />
              <span className="text-[15px] font-normal leading-normal font-barlow">
                Cont
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden sm:flex flex-col items-center text-gray-700 hover:text-black relative"
            >
              <Heart size={24} />
              <span className="text-[15px] font-normal leading-normal font-barlow">
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center text-gray-700 hover:text-black relative"
            >
              <ShoppingCart size={24} />
              <span className="text-[15px] font-normal leading-normal font-barlow">
                Coș
              </span>
              {count > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Căutați produse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-4 pr-12 border border-gray-300 rounded-lg text-base"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-600"
              >
                <Search size={24} />
              </button>
            </form>
            {searchQuery.trim().length >= 2 && liveSearchLoading && (
              <div className="w-full bg-white border border-gray-300 rounded-lg p-2 text-center text-sm text-gray-500">
                Searching...
              </div>
            )}
            {searchQuery.trim().length >= 2 &&
              !liveSearchLoading &&
              liveSearchResults.length > 0 && (
                <div className="w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {liveSearchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.handle}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 border-b last:border-b-0"
                      onClick={() => {
                        setLiveSearchResults([])
                        setSearchQuery('')
                      }}
                    >
                      {product.featuredImage?.url && (
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.priceRange.minVariantPrice.amount}{' '}
                          {product.priceRange.minVariantPrice.currencyCode}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            {searchQuery.trim().length >= 2 &&
              !liveSearchLoading &&
              liveSearchResults.length === 0 && (
                <div className="w-full bg-white border border-gray-300 rounded-lg p-2 text-center text-sm text-gray-500">
                  No results found.
                </div>
              )}
            <Link
              href="/account"
              className="flex items-center gap-2 text-gray-700"
            >
              <User size={20} />
              <span>Account</span>
            </Link>
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Link href="/" className="block py-2 text-gray-700">
                  Home
                </Link>
                <Link href="/deals" className="block py-2 text-gray-700">
                  Deals
                </Link>
                <Link href="/noutati" className="block py-2 text-gray-700">
                  Noutăți
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
