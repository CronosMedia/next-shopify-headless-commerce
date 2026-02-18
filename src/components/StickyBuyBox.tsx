'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, X, Minus, Plus, ChevronDown } from 'lucide-react'
import { useCart } from './CartProvider'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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

function ScrollspyNav() {
    const [activeSection, setActiveSection] = useState<string>('')

    useEffect(() => {
        // Hide Main Navbar when Sticky Bar is visible (Argos Style)
        // We do this by checking if ANY sticky bar instance is visible (controlled by parent)
        // But here we are inside the component. The parent controls 'isVisible'.
        // It's cleaner to do it in the main component.
    }, [])

    useEffect(() => {
        const sections = ['overview', 'specifications', 'reviews', 'recommended']
        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -40% 0px', // Offset for sticky header
            threshold: 0
        }

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id)
                }
            })
        }

        const observer = new IntersectionObserver(observerCallback, observerOptions)

        sections.forEach(id => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [])

    const navItems = [
        { id: 'overview', label: 'Descriere' },
        { id: 'specifications', label: 'Specificații' },
        { id: 'reviews', label: 'Recenzii' },
        { id: 'recommended', label: 'Recomandări' },
    ]

    return (
        <ul className="flex items-center gap-8 text-sm font-medium text-gray-600">
            {navItems.map(item => (
                <li key={item.id}>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            const element = document.getElementById(item.id)
                            if (element) {
                                const offset = 100 // Height of sticky bar + buffer
                                const elementPosition = element.getBoundingClientRect().top
                                const offsetPosition = elementPosition + window.pageYOffset - offset
                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: "smooth"
                                })
                            }
                        }}
                        className={cn(
                            "py-4 border-b-2 transition-colors",
                            activeSection === item.id
                                ? "text-black border-black"
                                : "border-transparent hover:text-black hover:border-gray-300"
                        )}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    )
}

export default function StickyBuyBox({
    product,
    variantId,
    isVisible
}: StickyBuyBoxProps) {
    const [isOpenMobile, setIsOpenMobile] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const { cart, addToCart, loading } = useCart()
    const cartCount = cart?.totalQuantity || 0

    // Toggle body class to hide main navbar
    useEffect(() => {
        if (isVisible) {
            document.body.classList.add('hide-navbar')
        } else {
            document.body.classList.remove('hide-navbar')
        }
        return () => document.body.classList.remove('hide-navbar')
    }, [isVisible])

    const handleAddToCart = async (quantity: number) => {
        if (!variantId) return
        await addToCart(variantId, quantity)
        setIsOpenMobile(false)
    }

    return (
        <>
            {/* Desktop Sticky Bar (Argos Style - Top) */}
            <div className={cn(
                "hidden md:flex fixed top-0 left-0 right-0 bg-white shadow-md z-[100] transform transition-transform duration-500 ease-in-out",
                isVisible ? "translate-y-0" : "-translate-y-full"
            )}>
                <div className="max-w-6xl mx-auto w-full px-6 h-[88px] flex items-center justify-between gap-6">

                    {/* Left: Product Info */}
                    <div className="flex items-center gap-4 min-w-0 w-1/3">
                        {product.featuredImage && (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-100 shrink-0">
                                <Image
                                    src={product.featuredImage.url}
                                    alt={product.featuredImage.altText || product.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">{product.title}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-gray-900">{product.price} {product.currency}</span>
                                {product.availableForSale ?
                                    <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">In Stoc</span> :
                                    <span className="text-xs text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">Stoc Epuizat</span>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Center: Navigation Links (Scrollspy) */}
                    <nav className="flex-1 flex justify-center">
                        <ScrollspyNav />
                    </nav>

                    {/* Right: Add to Cart */}
                    <div className="flex items-center gap-3 w-1/3 justify-end">
                        <button
                            onClick={() => handleAddToCart(1)}
                            disabled={!product.availableForSale || loading}
                            className={cn(
                                "h-12 px-6 rounded-lg font-bold text-lg transition-all flex items-center gap-2 shadow-lg", // Updated based on user feedback
                                product.availableForSale && !loading
                                    ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] hover:shadow-xl' // Exact BuyBox style
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            )}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    <span>Adaugă în coș</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bar */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 md:hidden transition-transform duration-300 ease-in-out",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                            {product.price} {product.currency}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => handleAddToCart(1)}
                            disabled={!product.availableForSale || loading}
                            className={cn(
                                "px-6 py-3 rounded-lg font-medium transition-colors shadow-sm",
                                product.availableForSale && !loading
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            )}
                        >
                            {loading ? '...' : 'Adaugă'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
