'use client'

import Link from 'next/link'
import { Truck, Lock, RefreshCw } from 'lucide-react'

export default function UtilityBar() {
  return (
    <div className="bg-white border-b border-gray-200 py-2">
      <div className="max-w-max mx-auto px-4 flex items-center justify-center space-x-6">
        <Link
          href="/livrare-gratuita"
          className="flex items-center gap-2 text-base text-gray-700 hover:text-black"
        >
          <Truck size={22} />
          <span>Livrare gratuită</span>
        </Link>
        <div className="h-5 border-l border-gray-300"></div>{' '}
        {/* Vertical divider */}
        <Link
          href="/plati-sigure"
          className="flex items-center gap-2 text-base text-gray-700 hover:text-black"
        >
          <Lock size={22} />
          <span>Plăți sigure</span>
        </Link>
        <div className="h-5 border-l border-gray-300"></div>{' '}
        {/* Vertical divider */}
        <Link
          href="/politica-retur"
          className="flex items-center gap-2 text-base text-gray-700 hover:text-black"
        >
          <RefreshCw size={22} />
          <span>Politica de retur</span>
        </Link>
      </div>
    </div>
  )
}
