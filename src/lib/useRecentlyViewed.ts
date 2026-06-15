import {useCallback, useEffect, useState} from 'react'

export type RecentProduct = {
    id: string
    handle: string
    title: string
    featuredImage: {
        url: string
        altText: string | null
        width: number
        height: number
    } | null
    price: string
    currencyCode: string
}

const STORAGE_KEY = 'recently_viewed_products'
const MAX_ITEMS = 10

export function useRecentlyViewed() {
    const [viewedProducts, setViewedProducts] = useState<RecentProduct[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                setViewedProducts(JSON.parse(stored))
            }
        } catch {
            localStorage.removeItem(STORAGE_KEY)
        }
        setIsInitialized(true)
    }, [])

    const addProduct = useCallback((product: RecentProduct) => {
        if (!product || !product.id) return

        setViewedProducts((prev) => {
            // Remove duplicates (same ID)
            const filtered = prev.filter((p) => p.id !== product.id)

            // Add new product to the beginning
            const updated = [product, ...filtered].slice(0, MAX_ITEMS)

            // Save to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

            return updated
        })
    }, [])

    return {
        viewedProducts,
        addProduct,
        isInitialized
    }
}
