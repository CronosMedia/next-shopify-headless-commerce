'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'
import {useAuth} from '@/components/AuthProvider'
import {useToast} from '@/components/ToastProvider'

export type WishlistItem = {
  id: string
  productId?: string
  handle: string
  productHandle?: string
  variantId?: string | null
  addedAt?: string
  title: string
  featuredImage?: {
    url: string
    altText?: string | null
  } | null
  priceRange?: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  variants?: {
    edges: Array<{
      node: {
        id: string
        availableForSale?: boolean
      }
    }>
  }
}

type WishlistContextType = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  toggleItem: (item: WishlistItem) => void
  count: number
  ready: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'wishlist_items'
const MERGE_SIGNATURE_KEY_PREFIX = 'wishlist_items_merged_signature'
const WISHLIST_LIMIT = 100

function getWishlistKey(item: Pick<WishlistItem, 'id' | 'handle'>) {
  return item.id || `handle:${item.handle}`
}

function normalizeWishlistItem(item: unknown): WishlistItem | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null

  const source = item as Partial<WishlistItem>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  const productId = typeof source.productId === 'string' ? source.productId.trim() : ''
  const handle = typeof source.handle === 'string' ? source.handle.trim() : ''
  const productHandle = typeof source.productHandle === 'string' ? source.productHandle.trim() : ''
  const title = typeof source.title === 'string' ? source.title.trim() : ''

  const nextId = productId || id
  const nextHandle = productHandle || handle

  if (!nextId && !nextHandle) return null

  return {
    id: nextId,
    productId: nextId,
    handle: nextHandle,
    productHandle: nextHandle,
    variantId: source.variantId || source.variants?.edges[0]?.node.id || null,
    addedAt: source.addedAt || new Date().toISOString(),
    title: title || nextHandle || 'Produs',
    featuredImage: source.featuredImage,
    priceRange: source.priceRange,
    variants: source.variants,
  }
}

function mergeWishlistItems(...lists: WishlistItem[][]) {
  const merged: WishlistItem[] = []
  const seen = new Set<string>()

  lists.flat().forEach((item) => {
    const normalized = normalizeWishlistItem(item)
    if (!normalized) return

    const key = getWishlistKey(normalized)
    if (seen.has(key)) return

    seen.add(key)
    merged.push(normalized)
  })

  return merged.slice(0, WISHLIST_LIMIT)
}

function readLocalWishlist() {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? mergeWishlistItems(parsed) : []
  } catch {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    return []
  }
}

function writeLocalWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
}

function getLocalWishlistSignature(items: WishlistItem[]) {
  return mergeWishlistItems(items)
    .map(getWishlistKey)
    .sort()
    .join('|')
}

function getMergeSignatureKey(userId: string) {
  return `${MERGE_SIGNATURE_KEY_PREFIX}_${encodeURIComponent(userId)}`
}

async function fetchAccountWishlist() {
  const response = await fetch('/api/account/wishlist', {cache: 'no-store'})
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Nu am putut încărca wishlistul.')
  }

  return mergeWishlistItems(data.wishlist || [])
}

async function replaceAccountWishlist(items: WishlistItem[]) {
  const response = await fetch('/api/account/wishlist', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({wishlist: items}),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Nu am putut salva wishlistul.')
  }

  return mergeWishlistItems(data.wishlist || [])
}

async function addAccountWishlistItem(item: WishlistItem) {
  const response = await fetch('/api/account/wishlist', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({item}),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Nu am putut salva produsul la favorite.')
  }

  return mergeWishlistItems(data.wishlist || [])
}

async function removeAccountWishlistItem(id: string) {
  const params = new URLSearchParams({productId: id})
  const response = await fetch(`/api/account/wishlist?${params.toString()}`, {
    method: 'DELETE',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Nu am putut elimina produsul de la favorite.')
  }

  return mergeWishlistItems(data.wishlist || [])
}

export function WishlistProvider({children}: {children: ReactNode}) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const {user, loading: authLoading} = useAuth()
  const {showToast} = useToast()

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    const initializeWishlist = async () => {
      if (!user) {
        setItems(readLocalWishlist())
        setIsInitialized(true)
        return
      }

      setIsInitialized(false)
      try {
        const accountItems = await fetchAccountWishlist()
        const localItems = readLocalWishlist()
        const localSignature = getLocalWishlistSignature(localItems)
        const mergeSignatureKey = getMergeSignatureKey(user.id)
        const previousMergedSignature = window.localStorage.getItem(mergeSignatureKey)
        const shouldMergeLocal = localItems.length > 0 && localSignature !== previousMergedSignature
        const nextItems = shouldMergeLocal
          ? await replaceAccountWishlist(mergeWishlistItems(accountItems, localItems))
          : accountItems

        if (shouldMergeLocal) {
          window.localStorage.setItem(mergeSignatureKey, localSignature)
        }

        if (!cancelled) {
          setItems(nextItems)
        }
      } catch {
        if (!cancelled) {
          setItems([])
          showToast('Nu am putut încărca wishlistul din cont.')
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true)
        }
      }
    }

    initializeWishlist()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, showToast])

  useEffect(() => {
    if (!isInitialized || authLoading || user) return
    writeLocalWishlist(items)
  }, [authLoading, isInitialized, items, user])

  const addItem = useCallback((item: WishlistItem) => {
    const normalized = normalizeWishlistItem(item)
    if (!normalized) return

    if (!user) {
      setItems((prev) => mergeWishlistItems(prev, [normalized]))
      return
    }

    const previousItems = items
    setItems((prev) => mergeWishlistItems(prev, [normalized]))
    addAccountWishlistItem(normalized)
      .then(setItems)
      .catch((error: unknown) => {
        setItems(previousItems)
        showToast(error instanceof Error ? error.message : 'Nu am putut salva produsul la favorite.')
      })
  }, [items, showToast, user])

  const removeItem = useCallback((id: string) => {
    if (!user) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      return
    }

    const previousItems = items
    setItems((prev) => prev.filter((item) => item.id !== id))
    removeAccountWishlistItem(id)
      .then(setItems)
      .catch((error: unknown) => {
        setItems(previousItems)
        showToast(error instanceof Error ? error.message : 'Nu am putut elimina produsul de la favorite.')
      })
  }, [items, showToast, user])

  const isInWishlist = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  )

  const showWishlistFeedback = useCallback((message: string, productTitle: string, productImage?: string) => {
    showToast({
      message,
      productTitle,
      productImage,
      type: 'success',
    })

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(80)
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reveal-bottom-nav'))
    }
  }, [showToast])

  const toggleItem = useCallback(
    (item: WishlistItem) => {
      if (isInWishlist(item.id)) {
        removeItem(item.id)
        showWishlistFeedback('Eliminat de la favorite', item.title, item.featuredImage?.url)
      } else {
        addItem(item)
        showWishlistFeedback('Salvat la favorite', item.title, item.featuredImage?.url)
      }
    },
    [addItem, isInWishlist, removeItem, showWishlistFeedback]
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      isInWishlist,
      toggleItem,
      count: items.length,
      ready: isInitialized && !authLoading,
    }),
    [addItem, authLoading, isInWishlist, isInitialized, items, removeItem, toggleItem]
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
