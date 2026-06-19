'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useScrollDirection } from '@/hooks/useScrollDirection'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { cart } = useCart()
  const { count: wishlistCount } = useWishlist()
  const cartCount = cart?.totalQuantity || 0
  const { scrollDirection, isTop } = useScrollDirection()

  // Bottom Nav visibility logic
  const isBottomNavVisible = scrollDirection === 'up' || isTop

  const navItems = [
    {
      label: 'Acasă',
      icon: Home,
      href: '/',
      active: pathname === '/',
    },
    {
      label: 'Caută',
      icon: Search,
      onClick: () => {
        // Dispatch custom event to open search in MainHeader
        window.dispatchEvent(new CustomEvent('trigger-search'))
      },
      active: pathname === '/search',
    },
    {
      label: 'Favorite',
      icon: Heart,
      href: '/wishlist',
      active: pathname === '/wishlist',
      badge: wishlistCount,
    },
    {
      label: 'Coș',
      icon: ShoppingBag,
      href: '/cart',
      active: pathname === '/cart',
      badge: cartCount,
    },
    {
      label: 'Cont',
      icon: User,
      href: '/account',
      active: pathname.startsWith('/account'),
    },
  ]

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--background)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-transform duration-300 transform ${isBottomNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full relative py-2">
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={item.active ? 2 : 1.5}
                  className={`transition-colors duration-300 ${
                    item.active ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-in scale-in duration-300">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-wider uppercase font-light transition-all duration-300 ${
                  item.active
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                {item.label}
              </span>
            </div>
          )

          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex-1 h-full focus:outline-none cursor-pointer"
                aria-label={item.label}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={index}
              href={item.href || '#'}
              className="flex-1 h-full block focus:outline-none"
              aria-label={item.label}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
