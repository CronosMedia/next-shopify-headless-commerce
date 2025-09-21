'use client'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './CartProvider'
import Link from 'next/link'

export default function Cart() {
  const { cart } = useCart()

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1 text-gray-700 hover:text-green-600"
    >
      <ShoppingCart size={20} />
      <span className="hidden sm:inline text-sm">Cart</span>
      {cart && cart.totalQuantity > 0 && (
        <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cart.totalQuantity}
        </span>
      )}
    </Link>
  )
}
