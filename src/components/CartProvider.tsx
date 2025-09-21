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

import {
  cartCreate,
  cartGet,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
  cartBuyerIdentityUpdate,
  // cartDeliveryOptionUpdate,
} from '@/lib/cart'
import type { Cart, CartLine } from '@/lib/cart' // Modified: Added CartLine
import type { Address } from '@/components/AddressModal'
import type { DeliveryOption, CartBuyerIdentityInput } from '@/lib/types'

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
  selectedDeliveryAddress: Address | null
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

  const [availableDeliveryOptions, setAvailableDeliveryOptions] = useState<
    DeliveryOption[]
  >([])
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOption | null>(null)
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] =
    useState<Address | null>(null)

  // New: Load recently removed items from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY);
      if (storedItems) {
        try {
          setRecentlyRemovedItems(JSON.parse(storedItems));
        } catch (e) {
          console.error("Failed to parse recently removed items from localStorage", e);
          localStorage.removeItem(LOCAL_STORAGE_RECENTLY_REMOVED_KEY);
        }
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

  const syncFromCart = useCallback((c: Cart | null) => {
    if (!c) return
    // delivery options
    const dg = c.deliveryGroups?.edges?.[0]?.node
    if (dg?.deliveryOptions) setAvailableDeliveryOptions(dg.deliveryOptions)
    if (dg?.selectedDeliveryOption)
      setSelectedDeliveryOption(dg.selectedDeliveryOption)
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
        id: `${addr.firstName ?? ''}-${addr.lastName ?? ''}-${
          addr.address1 ?? ''
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
  }, [])

  const createCart = useCallback(
    async (lines?: { merchandiseId: string; quantity: number }[]) => {
      setLoading(true)
      try {
        const newCart = await cartCreate(lines)
        if (!newCart) throw new Error('Failed to create cart')
        setCartId(newCart.id)
        syncFromCart(newCart)
        return newCart
      } finally {
        setLoading(false)
      }
    },
    [syncFromCart]
  )

  const fetchCart = useCallback(
    async (cartId: string) => {
      setLoading(true)
      try {
        const fetched = await cartGet(cartId)
        syncFromCart(fetched ?? null)
        return fetched
      } finally {
        setLoading(false)
      }
    },
    [syncFromCart]
  )

  const ensureCart = useCallback(async () => {
    const cartId = getCartId()
    if (cartId) {
      try {
        const fetched = await fetchCart(cartId)
        if (fetched) return fetched
        localStorage.removeItem('cartId')
      } catch (err) {
        console.error('Failed to fetch cart by id, will create new one', err)
        localStorage.removeItem('cartId')
      }
    }
    return createCart()
  }, [fetchCart, createCart])

  useEffect(() => {
    // on mount, try to hydrate existing cart
    const init = async () => {
      try {
        setLoading(true)
        await ensureCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [ensureCart])

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const updated = await cartLinesAdd(currentCart.id, [
          { merchandiseId: variantId, quantity },
        ])
        syncFromCart(updated ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const updateCartItemQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        const updated = await cartLinesUpdate(currentCart.id, [
          { id: lineId, quantity },
        ])
        syncFromCart(updated ?? null)
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

        const updated = await cartLinesRemove(currentCart.id, [lineId])
        syncFromCart(updated ?? null)

        if (removedLine) {
          setRecentlyRemovedItems((prev) => {
            const newItem: RecentlyRemovedItem = {
              id: removedLine.id,
              merchandiseId: removedLine.merchandise.id,
              quantity: removedLine.quantity,
              title: removedLine.merchandise.product.title,
              image: removedLine.merchandise.image || removedLine.merchandise.product.featuredImage,
            };
            // Add new item to the beginning and limit array size
            return [newItem, ...prev].slice(0, MAX_RECENTLY_REMOVED_ITEMS);
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart, addToCart] // Modified: Removed MAX_RECENTLY_REMOVED_ITEMS from dependencies, added addToCart
  )

  const restoreCartItem = useCallback(
    async (itemToRestore: RecentlyRemovedItem) => {
      setLoading(true);
      setError(null);
      try {
        await addToCart(itemToRestore.merchandiseId, itemToRestore.quantity);
        setRecentlyRemovedItems((prev) =>
          prev.filter((item) => item.id !== itemToRestore.id)
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
    setRecentlyRemovedItems((prev) => prev.filter((item) => item.id !== itemId));
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
          setRecentlyRemovedItems((prev) => [...removedItems, ...prev].slice(0, MAX_RECENTLY_REMOVED_ITEMS));

          const updated = await cartLinesRemove(currentCart.id, lineIds)
          syncFromCart(updated ?? null)
        } else {
          // If cart is already empty, just set it to null or an empty cart structure
          setCart(null) // Or an empty cart object if preferred
          localStorage.removeItem('cartId') // Clear cartId from localStorage
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
        const buyerIdentity: CartBuyerIdentityInput = {
          deliveryAddressPreferences: [
            {
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
          ],
        }
        const updated = await cartBuyerIdentityUpdate(
          currentCart.id,
          buyerIdentity
        )
        syncFromCart(updated ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const updateDeliveryOption = useCallback(
    async (handle: string) => {
      setLoading(true)
      setError(null)
      try {
        const currentCart = cart ?? (await ensureCart())
        if (!currentCart) throw new Error('No cart available')
        // const updated = await cartDeliveryOptionUpdate(currentCart.id, handle)
        // syncFromCart(updated ?? null)
        console.warn('updateDeliveryOption is not implemented')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, ensureCart, syncFromCart]
  )

  const shippingCost = useMemo(() => {
    const amount = selectedDeliveryOption?.estimatedCost?.amount
      ? parseFloat(selectedDeliveryOption.estimatedCost.amount)
      : 0
    return Math.max(0, amount)
  }, [selectedDeliveryOption])

  const subtotal = useMemo(() => {
    const amount = cart?.cost?.subtotalAmount?.amount
      ? parseFloat(cart.cost.subtotalAmount.amount)
      : 0
    return Math.max(0, amount)
  }, [cart?.cost?.subtotalAmount?.amount])

  const total = useMemo(() => {
    const amount = cart?.cost?.totalAmount?.amount
      ? parseFloat(cart.cost.totalAmount.amount)
      : 0
    return Math.max(0, amount)
  }, [cart?.cost?.totalAmount?.amount])

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
      selectedDeliveryAddress,
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
      selectedDeliveryOption,
      availableDeliveryOptions,
      shippingCost,
      subtotal,
      total,
      updateDeliveryAddress,
      updateDeliveryOption,
      recentlyRemovedItems,
      restoreCartItem,
      removeRecentlyRemovedItem,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
