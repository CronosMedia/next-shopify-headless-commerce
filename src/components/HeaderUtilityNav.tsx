'use client'
import Link from 'next/link'
import { Truck, RefreshCw, Store, HelpCircle } from 'lucide-react'

export default function HeaderUtilityNav() {
  return (
    <div className="bg-gray-100 text-gray-700 text-sm py-2">
      <div className="max-w-6xl mx-auto px-4 flex justify-end space-x-6">
        <Link href="/order-tracking" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <Truck size={16} />
          <span>Urmărește Comanda</span>
        </Link>
        <Link href="/returns" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <RefreshCw size={16} />
          <span>Retururi</span>
        </Link>
        <Link href="/stores" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <Store size={16} />
          <span>Magazine</span>
        </Link>
        <Link href="/help" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <HelpCircle size={16} />
          <span>Ajutor</span>
        </Link>
      </div>
    </div>
  )
}
