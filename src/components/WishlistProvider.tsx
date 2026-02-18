'use client'

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from 'react'

export type WishlistItem = {
    id: string
    handle: string
    title: string
    featuredImage?: {
        url: string
        altText?: string
    } | null
    priceRange?: {
        minVariantPrice: {
            amount: string
            currencyCode: string
        }
    }
}

type WishlistContextType = {
    items: WishlistItem[]
    addItem: (item: WishlistItem) => void
    removeItem: (id: string) => void
    isInWishlist: (id: string) => boolean
    toggleItem: (item: WishlistItem) => void
    count: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'wishlist_items'

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
            try {
                setItems(JSON.parse(stored))
            } catch (e) {
                console.error('Failed to parse wishlist from local storage', e)
                localStorage.removeItem(LOCAL_STORAGE_KEY)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save to local storage on change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
        }
    }, [items, isInitialized])

    const addItem = useCallback((item: WishlistItem) => {
        setItems((prev) => {
            if (prev.some((i) => i.id === item.id)) return prev
            return [...prev, item]
        })
    }, [])

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id))
    }, [])

    const isInWishlist = useCallback(
        (id: string) => items.some((i) => i.id === id),
        [items]
    )

    const toggleItem = useCallback(
        (item: WishlistItem) => {
            if (isInWishlist(item.id)) {
                removeItem(item.id)
            } else {
                addItem(item)
            }
        },
        [isInWishlist, addItem, removeItem]
    )

    const value = useMemo(
        () => ({
            items,
            addItem,
            removeItem,
            isInWishlist,
            toggleItem,
            count: items.length,
        }),
        [items, addItem, removeItem, isInWishlist, toggleItem]
    )

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const ctx = useContext(WishlistContext)
    if (!ctx) {
        throw new Error('useWishlist must be used within a WishlistProvider')
    }
    return ctx
}
