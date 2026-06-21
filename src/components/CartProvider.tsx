'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import type { ReactNode } from 'react'
import { romanianCounties } from '@/lib/geo-data'

import type { Cart, CartLine } from '@/lib/cart' // Modified: Added CartLine
import type { Address } from '@/components/AddressModal'
import { useToast } from '@/components/ToastProvider'
import type { DeliveryOption } from '@/lib/types'

const LOCAL_STORAGE_RECENTLY_REMOVED_KEY = 'recentlyRemovedItems'; // New constant

type RecentlyRemovedItem = {
  id: string; // lineId
  merchandiseId: string;
  quantity: number;
  title: string;
  image?: {
    url: string;
    altText: string | null;
  };
};

const MAX_RECENTLY_REMOVED_ITEMS = 5; // Limit the history

type CartContextType = {
  cart: Cart | null
  loading: boolean
  error: string | null
  setError: (err: string | null) => void
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
  updateCartItemQuantity: (lineId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  setSelectedDeliveryOption: (option: DeliveryOption | null) => Promise<void>
  setSelectedDeliveryAddress: (address: Address | null) => Promise<void>
  setSelectedBillingAddress: (address: Address | null) => Promise<void>
  selectedDeliveryAddress: Address | null
  selectedBillingAddress: Address | null
  selectedDeliveryOption: DeliveryOption | null
  availableDeliveryOptions: DeliveryOption[]
  shippingCost: number
  subtotal: number
  total: number
  recentlyRemovedItems: RecentlyRemovedItem[]; // Added
  restoreCartItem: (item: RecentlyRemovedItem) => Promise<void>; // Added
  removeRecentlyRemovedItem: (itemId: string) => void; // New: Added
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentlyRemovedItems, setRecentlyRemovedItems] = useState<RecentlyRemovedItem[]>([]); // Added
  const { showToast } = useToast()

  const [availableDeliveryOptions, setAvailableDeliveryOptions] = useState<
    DeliveryOption[]
  >([])
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOption | null>(null)
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] =
    useState<Address | null>(null)
  const [selectedBillingAddress, setSelectedBillingAddress] =
    useState<Address | null>(null)

  // New: Load recently removed items from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY);
      if (storedItems) {
        try {
          const parsed = JSON.parse(storedItems) as RecentlyRemovedItem[];
          if (Array.isArray(parsed)) {
            // Deduplicate items on load to clean up any legacy duplicates in cache
            const seen = new Set<string>();
            const unique: RecentlyRemovedItem[] = [];
            for (const item of parsed) {
              if (item && item.merchandiseId && !seen.has(item.merchandiseId)) {
                seen.add(item.merchandiseId);
                unique.push(item);
              }
            }
            setRecentlyRemovedItems(unique);
          }
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY);
        }
      }
    }
  }, []);

  // Load selected billing address from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedBillingAddress');
      if (stored) {
        try {
          setSelectedBillingAddress(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const getCartId = () =>
    typeof window !== 'undefined' ? localStorage.getItem('cartId') : null
  const setCartId = (id: string) =>
    typeof window !== 'undefined' && localStorage.setItem('cartId', id)

  // New: Save recently removed items to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && recentlyRemovedItems.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY, JSON.stringify(recentlyRemovedItems));
    } else if (typeof window !== 'undefined' && recentlyRemovedItems.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY);
    }
  }, [recentlyRemovedItems]);

  // Save selected billing address to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedBillingAddress) {
        localStorage.setItem('selectedBillingAddress', JSON.stringify(selectedBillingAddress));
      } else {
        localStorage.removeItem('selectedBillingAddress');
      }
    }
  }, [selectedBillingAddress]);

  const syncFromCart = useCallback((c: Cart | null) => {
    if (!c) return
    // delivery options
    const dg = c.deliveryGroups?.edges?.[0]?.node
    if (dg?.deliveryOptions) {
      setAvailableDeliveryOptions(dg.deliveryOptions)
    } else {
      setAvailableDeliveryOptions([])
    }
    setSelectedDeliveryOption(dg?.selectedDeliveryOption || null)
    if (dg?.deliveryAddress) {
      const addr = dg.deliveryAddress

      // Convert province code to name
      const provinceCode = addr.province;
      const county = romanianCounties.find(c => c.code === provinceCode);
      const provinceName = county ? county.name : provinceCode; // Fallback to code if not found

      // Convert country code to name
      let countryName = addr.country;
      if (countryName && countryName.toUpperCase() === 'RO') {
        countryName = 'Romania';
      }

      setSelectedDeliveryAddress({
        id: `${addr.firstName ?? ''}-${addr.lastName ?? ''}-${addr.address1 ?? ''
          }`,
        firstName: addr.firstName || '',
        lastName: addr.lastName || '',
        company: addr.company || undefined,
        name: `${addr.firstName || ''} ${addr.lastName || ''}`,
        address1: addr.address1 || '',
        address2: addr.address2 ?? null,
        city: addr.city || '',
        country: countryName || '',
        province: provinceName || undefined,
        zip: addr.zip || '',
        phone: addr.phone || undefined,
        isDefault: false,
      })
    }
    setCart(c)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartLineCount', String(c.lines.edges.length))
    }
  }, [])

  const showAddToCartFeedback = useCallback((productTitle: string, productImage?: string) => {
    showToast({
      message: 'Produs adăugat în coș',
      productTitle,
      productImage,
      type: 'success'
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

  const createCart = useCallback(
    async (lines?: { merchandiseId: string; quantity: number }[]) => {
      setLoading(true)
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', lines }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          throw new Error(data.error?.message || 'Failed to create cart')
        }
        setCartId(data.cart.id)
        syncFromCart(data.cart)
        
        if (lines && lines.length > 0) {
          const variantId = lines[0].merchandiseId
          const addedLine = data.cart.lines.edges.find(
            ({ node }: { node: CartLine }) => node.merchandise.id === variantId
          )?.node
          if (addedLine) {
            const title = addedLine.merchandise.product?.title || addedLine.merchandise.title || 'Produs'
            const imgUrl = addedLine.merchandise.image?.url || addedLine.merchandise.product?.featuredImage?.url
            showAddToCartFeedback(title, imgUrl)
          }
        }
        
        return data.cart
      } finally {
        setLoading(false)
      }
    },
    [syncFromCart, showAddToCartFeedback]
  )

  const fetchCart = useCallback(
    async (cartId: string) => {
      setLoading(true)
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', cartId }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (response.ok && data.cart) {
          syncFromCart(data.cart)
          return data.cart
        }
        return null
      } finally {
        setLoading(false)
      }
    },
    [syncFromCart]
  )

  const ensureCart = useCallback(async () => {
    if (cart) return cart
    const cartId = getCartId()
    if (cartId) {
      try {
        const fetched = await fetchCart(cartId)
        if (fetched) return fetched
        localStorage.removeItem('cartId')
      } catch {
        localStorage.removeItem('cartId')
      }
    }
    return createCart()
  }, [cart, fetchCart, createCart])

  useEffect(() => {
    // on mount, try to hydrate existing cart (lazy creation)
    const init = async () => {
      const cartId = getCartId()
      if (cartId) {
        try {
          setLoading(true)
          const fetched = await fetchCart(cartId)
          if (!fetched) {
            localStorage.removeItem('cartId')
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
          localStorage.removeItem('cartId')
        } finally {
          setLoading(false)
        }
      }
    }
    init()
  }, [fetchCart])

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_lines',
            cartId: currentCart.id,
            lines: [{ merchandiseId: variantId, quantity }],
          }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          const errMsg = data.error?.message || ''
          if (
            errMsg.includes('does not exist') ||
            errMsg.includes('not found')
          ) {
            localStorage.removeItem('cartId')
            setCart(null)
            await createCart([{ merchandiseId: variantId, quantity }])
            return
          }
          throw new Error(errMsg || 'Failed to add lines to cart')
        }
        syncFromCart(data.cart)
        
        const addedLine = data.cart.lines.edges.find(
          ({ node }: { node: CartLine }) => node.merchandise.id === variantId
        )?.node
        if (addedLine) {
          const title = addedLine.merchandise.product?.title || addedLine.merchandise.title || 'Produs'
          const imgUrl = addedLine.merchandise.image?.url || addedLine.merchandise.product?.featuredImage?.url
          showAddToCartFeedback(title, imgUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart, createCart, showAddToCartFeedback]
  )

  const updateCartItemQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_lines',
            cartId: currentCart.id,
            lines: [{ id: lineId, quantity }],
          }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          const errMsg = data.error?.message || ''
          if (
            errMsg.includes('does not exist') ||
            errMsg.includes('not found')
          ) {
            localStorage.removeItem('cartId')
            setCart(null)
            return
          }
          throw new Error(errMsg || 'Failed to update cart')
        }
        syncFromCart(data.cart)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const removeFromCart = useCallback(
    async (lineId: string) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')

        // Find the item to be removed to save its details
        const removedLine = currentCart.lines.edges.find(
          ({ node }: { node: CartLine }) => node.id === lineId // Modified: Typed edge
        )?.node;

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove_lines',
            cartId: currentCart.id,
            lineIds: [lineId],
          }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          const errMsg = data.error?.message || ''
          if (
            errMsg.includes('does not exist') ||
            errMsg.includes('not found')
          ) {
            localStorage.removeItem('cartId')
            setCart(null)
            return
          }
          throw new Error(errMsg || 'Failed to remove lines')
        }
        syncFromCart(data.cart)

        if (removedLine) {
          setRecentlyRemovedItems((prev) => {
            const newItem: RecentlyRemovedItem = {
              id: removedLine.id,
              merchandiseId: removedLine.merchandise.id,
              quantity: removedLine.quantity,
              title: removedLine.merchandise.product.title,
              image: removedLine.merchandise.image || removedLine.merchandise.product.featuredImage,
            };
            // Filter out any existing item with the same merchandiseId to avoid duplicates
            const filtered = prev.filter((item) => item.merchandiseId !== newItem.merchandiseId);
            return [newItem, ...filtered].slice(0, MAX_RECENTLY_REMOVED_ITEMS);
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const restoreCartItem = useCallback(
    async (itemToRestore: RecentlyRemovedItem) => {
      setLoading(true);
      setError(null);
      try {
        await addToCart(itemToRestore.merchandiseId, itemToRestore.quantity);
        setRecentlyRemovedItems((prev) =>
          prev.filter((item) => item.merchandiseId !== itemToRestore.merchandiseId)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addToCart]
  );

  const removeRecentlyRemovedItem = useCallback((itemId: string) => {
    setRecentlyRemovedItems((prev) => {
      const targetItem = prev.find((item) => item.id === itemId);
      if (!targetItem) return prev;
      return prev.filter((item) => item.merchandiseId !== targetItem.merchandiseId);
    });
  }, []);

  const clearCart = useCallback(
    async () => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')

        const lineIds = currentCart.lines.edges.map(({ node }: { node: CartLine }) => node.id) // Modified: Typed edge
        if (lineIds.length > 0) {
          // Store all cleared items as recently removed
          const removedItems = currentCart.lines.edges.map(({ node }: { node: CartLine }) => ({
            id: node.id,
            merchandiseId: node.merchandise.id,
            quantity: node.quantity,
            title: node.merchandise.product.title,
            image: node.merchandise.image || node.merchandise.product.featuredImage,
          }));
          setRecentlyRemovedItems((prev) => {
            const seen = new Set<string>();
            const merged: RecentlyRemovedItem[] = [];
            // Add new items first to keep them at the top
            for (const item of removedItems) {
              if (!seen.has(item.merchandiseId)) {
                seen.add(item.merchandiseId);
                merged.push(item);
              }
            }
            // Add existing items that don't duplicate merchandiseId
            for (const item of prev) {
              if (!seen.has(item.merchandiseId)) {
                seen.add(item.merchandiseId);
                merged.push(item);
              }
            }
            return merged.slice(0, MAX_RECENTLY_REMOVED_ITEMS);
          });

          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'remove_lines',
              cartId: currentCart.id,
              lineIds,
            }),
          })
          const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
          if (!response.ok || !data.cart) {
            const errMsg = data.error?.message || ''
            if (
              errMsg.includes('does not exist') ||
              errMsg.includes('not found')
            ) {
              localStorage.removeItem('cartId')
              setCart(null)
              return
            }
            throw new Error(errMsg || 'Failed to clear cart')
          }
          syncFromCart(data.cart)
        } else {
          // If cart is already empty, just set it to null or an empty cart structure
          setCart(null) // Or an empty cart object if preferred
          localStorage.removeItem('cartId') // Clear cartId from localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('cartLineCount', '0')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart] // Modified: Removed MAX_RECENTLY_REMOVED_ITEMS from dependencies
  )

  const updateDeliveryAddress = useCallback(
    async (address: Address) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateDeliveryAddress',
            cartId: currentCart.id,
            address: {
              id: address.id,
              address1: address.address1,
              address2: address.address2 ?? undefined,
              city: address.city,
              company: address.company,
              country: address.country,
              firstName: address.firstName,
              lastName: address.lastName,
              phone: address.phone,
              province: address.province,
              zip: address.zip,
            },
          }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          throw new Error(data.error?.message || 'Failed to update delivery address')
        }
        syncFromCart(data.cart)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const updateBillingAddress = useCallback(
    async (address: Address) => {
      setSelectedBillingAddress(address)
    },
    []
  )

  const updateDeliveryOption = useCallback(
    async (handle: string) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const deliveryGroupId = currentCart.deliveryGroups?.edges?.[0]?.node?.id
        if (!deliveryGroupId) throw new Error('No delivery group available')
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_delivery_option',
            cartId: currentCart.id,
            deliveryGroupId,
            deliveryOptionHandle: handle,
          }),
        })
        const data = (await response.json()) as { cart?: Cart; error?: { message: string } }
        if (!response.ok || !data.cart) {
          throw new Error(data.error?.message || 'Failed to update delivery option')
        }
        syncFromCart(data.cart)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  useEffect(() => {
    if (cart && availableDeliveryOptions.length > 0 && !selectedDeliveryOption && !loading) {
      const firstOption = availableDeliveryOptions[0]
      updateDeliveryOption(firstOption.handle).catch(() => {
        // Safe catch for auto-select
      })
    }
  }, [availableDeliveryOptions, selectedDeliveryOption, cart, loading, updateDeliveryOption])

  const subtotal = useMemo(() => {
    const amount = cart?.cost?.subtotalAmount?.amount
      ? parseFloat(cart.cost.subtotalAmount.amount)
      : 0
    return Math.max(0, amount)
  }, [cart?.cost?.subtotalAmount?.amount])

  const shippingCost = useMemo(() => {
    if (subtotal === 0) return 0
    if (selectedDeliveryAddress && selectedDeliveryOption) {
      const amount = selectedDeliveryOption.estimatedCost?.amount
        ? parseFloat(selectedDeliveryOption.estimatedCost.amount)
        : 0
      return Math.max(0, amount)
    }
    return subtotal >= 500 ? 0 : 25
  }, [selectedDeliveryAddress, selectedDeliveryOption, subtotal])

  const total = useMemo(() => {
    if (subtotal === 0) return 0
    if (selectedDeliveryAddress && selectedDeliveryOption) {
      const amount = cart?.cost?.totalAmount?.amount
        ? parseFloat(cart.cost.totalAmount.amount)
        : 0
      return Math.max(0, amount)
    }
    return subtotal + (subtotal >= 500 ? 0 : 25)
  }, [selectedDeliveryAddress, selectedDeliveryOption, cart?.cost?.totalAmount?.amount, subtotal])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__cart = { addToCart, cart, loading }
    }
  }, [addToCart, cart, loading])

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      setError,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      setSelectedDeliveryOption: async (option: DeliveryOption | null) => {
        if (option) await updateDeliveryOption(option.handle)
        else setSelectedDeliveryOption(null)
      },
      setSelectedDeliveryAddress: async (address: Address | null) => {
        if (address) await updateDeliveryAddress(address)
        else setSelectedDeliveryAddress(null)
      },
      setSelectedBillingAddress: async (address: Address | null) => {
        if (address) await updateBillingAddress(address)
        else setSelectedBillingAddress(null)
      },
      selectedDeliveryAddress,
      selectedBillingAddress,
      selectedDeliveryOption,
      availableDeliveryOptions,
      shippingCost,
      subtotal,
      total,
      recentlyRemovedItems,
      restoreCartItem,
      removeRecentlyRemovedItem,
    }),
    [
      cart,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      selectedDeliveryAddress,
      selectedBillingAddress,
      selectedDeliveryOption,
      availableDeliveryOptions,
      shippingCost,
      subtotal,
      total,
      updateDeliveryAddress,
      updateBillingAddress,
      updateDeliveryOption,
      recentlyRemovedItems,
      restoreCartItem,
      removeRecentlyRemovedItem,
    ]
  )

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
