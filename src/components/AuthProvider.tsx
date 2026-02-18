'use client'
import { createContext, useContext, useEffect, useState } from 'react'

// Types
export type Address = {
  id: string
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  province: string
  zip: string
  country: string
  company?: string
  phone?: string
}

export type User = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  defaultAddress?: Address
  addresses: { edges: { node: Address }[] }
}

export type Order = {
  id: string
  orderNumber: number
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  totalPrice: { amount: string; currencyCode: string }
  successfulFulfillments?: Array<{
    trackingCompany: string
    trackingInfo: Array<{
      number: string
      url: string
    }>
  }>
  lineItems: { edges: { node: { title: string; quantity: number } }[] }
}

export type UpdateUserInput = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export type AddressInput = Omit<Address, 'id'>

export type ApiError = {
  error: { message: string; field?: string[] }
}

// The shape of the AuthContext
type AuthContextType = {
  user: User | null
  loading: boolean
  login: (
    email: string,
    password: string,
    cartId?: string
  ) => Promise<ApiError | null>
  logout: (cartId?: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    cartId?: string
  ) => Promise<ApiError | null>
  updateUser: (data: UpdateUserInput) => Promise<ApiError | null>
  fetchOrders: () => Promise<Order[]>
  addAddress: (address: AddressInput) => Promise<ApiError | null>
  updateAddress: (id: string, address: AddressInput) => Promise<ApiError | null>
  deleteAddress: (id: string) => Promise<ApiError | null>
  setDefaultAddress: (id: string) => Promise<ApiError | null>
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetches user data if a session exists
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (response.ok) {
        const { user } = await response.json()
        setUser(user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Function to manually refetch user data
  const refetchUser = () => {
    setLoading(true)
    checkAuth()
  }

  // --- Core Auth Functions ---

  const login = async (
    email: string,
    password: string,
    cartId?: string
  ): Promise<ApiError | null> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, cartId }), // Pass cartId to the API
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        return null
      }
      return data
    } catch (error) {
      return { error: { message: 'Login failed due to a network error.' } }
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    cartId?: string
  ): Promise<ApiError | null> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, cartId }), // Pass cartId
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        return null
      }
      return data
    } catch (error) {
      return {
        error: { message: 'Registration failed due to a network error.' },
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (cartId?: string) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId }), // Pass cartId to disassociate
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  // --- Account Management Functions ---

  const updateUser = async (
    data: UpdateUserInput
  ): Promise<ApiError | null> => {
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        refetchUser()
        return null
      }
      return await response.json()
    } catch (error) {
      return { error: { message: 'Update failed due to a network error.' } }
    }
  }

  const fetchOrders = async (): Promise<Order[]> => {
    try {
      const response = await fetch('/api/account/proxy/orders')
      if (response.ok) {
        const data = await response.json()
        if (data.orders) {
          return data.orders
        }
        return []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      return []
    }
  }

  const addAddress = async (
    address: AddressInput
  ): Promise<ApiError | null> => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (response.ok) {
        refetchUser()
        return null
      }
      return await response.json()
    } catch (error) {
      return {
        error: { message: 'Failed to add address due to a network error.' },
      }
    }
  }

  const updateAddress = async (
    id: string,
    address: AddressInput
  ): Promise<ApiError | null> => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, address }),
      })
      if (response.ok) {
        refetchUser()
        return null
      }
      return await response.json()
    } catch (error) {
      return {
        error: { message: 'Failed to update address due to a network error.' },
      }
    }
  }

  const deleteAddress = async (id: string): Promise<ApiError | null> => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        refetchUser()
        return null
      }
      return await response.json()
    } catch (error) {
      return {
        error: { message: 'Failed to delete address due to a network error.' },
      }
    }
  }

  const setDefaultAddress = async (id: string): Promise<ApiError | null> => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: id }),
      })
      if (response.ok) {
        refetchUser()
        return null
      }
      return await response.json()
    } catch (error) {
      return {
        error: {
          message: 'Failed to set default address due to a network error.',
        },
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        updateUser,
        fetchOrders,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}