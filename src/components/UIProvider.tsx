'use client'

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'

// Define a more specific type for the product in quick view
// This can be expanded based on what QuickViewModal needs
type QuickViewProduct = {
  handle: string
  // Add other necessary product fields here
}

type UIContextType = {
  isQuickViewOpen: boolean
  quickViewProduct: QuickViewProduct | null
  openQuickView: (product: QuickViewProduct) => void
  closeQuickView: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [isQuickViewOpen, setQuickViewOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] =
    useState<QuickViewProduct | null>(null)

  const openQuickView = (product: QuickViewProduct) => {
    setQuickViewProduct(product)
    setQuickViewOpen(true)
  }

  const closeQuickView = useCallback(() => {
    setQuickViewOpen(false)
    setQuickViewProduct(null)
  }, [])

  const value = useMemo(
    () => ({
      isQuickViewOpen,
      quickViewProduct,
      openQuickView,
      closeQuickView,
    }),
    [isQuickViewOpen, quickViewProduct]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
