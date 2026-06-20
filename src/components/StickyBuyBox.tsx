'use client'

import { useState, useEffect } from 'react'
import { useCart } from './CartProvider'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn, formatMoney } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/useScrollDirection'

type StickyBuyBoxProps = {
    product: {
        title: string
        price: string
        currency: string
        availableForSale: boolean
        featuredImage?: {
            url: string
            altText: string | null
        } | null
    }
    variantId?: string
    isVisible: boolean
}

export default function StickyBuyBox({
    product,
    variantId,
    isVisible
}: StickyBuyBoxProps) {
    const {cart, addToCart, loading} = useCart()
    const router = useRouter()
    const { scrollDirection, isTop } = useScrollDirection()
    const [isFooterVisible, setIsFooterVisible] = useState(false)
    const [forceShowBottomNav, setForceShowBottomNav] = useState(false)

    // Sync bottom nav pop-up visibility
    useEffect(() => {
        let timer: NodeJS.Timeout
        const handleReveal = () => {
            setForceShowBottomNav(true)
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                setForceShowBottomNav(false)
            }, 4000)
        }
        window.addEventListener('reveal-bottom-nav', handleReveal)
        return () => {
            window.removeEventListener('reveal-bottom-nav', handleReveal)
            if (timer) clearTimeout(timer)
        }
    }, [])

    const isBottomNavVisible = scrollDirection === 'up' || isTop || forceShowBottomNav
    const shouldBeVisible = isVisible && !isFooterVisible

    // Observe when the footer enters the viewport to hide the sticky buy box
    useEffect(() => {
        const footer = document.querySelector('footer')
        if (!footer) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFooterVisible(entry.isIntersecting)
            },
            {
                threshold: 0,
            }
        )

        observer.observe(footer)
        return () => observer.disconnect()
    }, [])

    const isItemInCart = cart?.lines.edges.some(
        ({ node }) => node.merchandise.id === variantId
    )

    const handleButtonClick = async () => {
        if (isItemInCart) {
            router.push('/cart')
            return
        }
        if (!variantId) return
        await addToCart(variantId, 1)
    }

    const bottomClass = isBottomNavVisible 
        ? "bottom-16 lg:bottom-0" 
        : "bottom-0"

    const buttonText = isItemInCart
        ? (loading ? '...' : (
            <>
                <span className="hidden sm:inline">Vezi Coșul</span>
                <span className="sm:hidden">Coș</span>
            </>
        ))
        : (loading ? '...' : (
            <>
                <span className="hidden sm:inline">Adaugă în coș</span>
                <span className="sm:hidden">Adaugă</span>
            </>
        ))

    const buttonClass = isItemInCart
        ? 'bg-transparent text-black border-black hover:bg-neutral-50 cursor-pointer'
        : (product.availableForSale && !loading
            ? 'bg-black text-white border-black hover:bg-neutral-800 cursor-pointer'
            : 'bg-neutral-100 text-neutral-300 cursor-not-allowed border border-neutral-200/50')

    return (
        <div className={cn(
            "fixed left-0 right-0 bg-[var(--background)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 transition-all duration-300 ease-in-out",
            shouldBeVisible ? "translate-y-0" : "translate-y-full",
            bottomClass
        )}>
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 h-20 flex items-center justify-between gap-6">
                {/* Left: Product Info with Image */}
                <div className="flex items-center gap-4 min-w-0">
                    {product.featuredImage && (
                        <div className="relative w-12 h-12 border border-[var(--border)] shrink-0 overflow-hidden bg-white hidden sm:block">
                            <Image
                                src={product.featuredImage.url}
                                alt={product.featuredImage.altText || product.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-1 text-sm md:text-base">
                            {product.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="font-bold text-gray-900 text-sm md:text-base">
                                {formatMoney(product.price, product.currency)}
                            </span>
                            {product.availableForSale ? (
                                <span className="text-[10px] md:text-xs text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 uppercase tracking-wider">
                                    În Stoc
                                </span>
                            ) : (
                                <span className="text-[10px] md:text-xs text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 uppercase tracking-wider">
                                    Stoc Epuizat
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Add to Cart Button */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleButtonClick}
                        disabled={(!product.availableForSale && !isItemInCart) || loading}
                        className={cn(
                            "h-12 px-6 flex items-center justify-center text-xs md:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 border",
                            buttonClass
                        )}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    )
}
