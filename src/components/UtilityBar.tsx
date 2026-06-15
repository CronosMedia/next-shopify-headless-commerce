'use client'

import Link from 'next/link'
import { Truck, Lock, RefreshCw } from 'lucide-react'

export default function UtilityBar() {
  return (
    <div className="bg-[var(--secondary)] border-b border-[var(--border)] py-2">
      <div className="max-w-full mx-auto px-4 flex items-center justify-center space-x-8">
        <Link
          href="/livrare-gratuita"
          className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <Truck size={14} strokeWidth={1.5} />
          <span>Free Shipping</span>
        </Link>
        <div className="h-3 border-l border-[var(--muted)]" />
        <Link
          href="/plati-sigure"
          className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <Lock size={14} strokeWidth={1.5} />
          <span>Secure Payment</span>
        </Link>
        <div className="h-3 border-l border-[var(--muted)]" />
        <Link
          href="/politica-retur"
          className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <RefreshCw size={14} strokeWidth={1.5} />
          <span>Easy Returns</span>
        </Link>
      </div>
    </div>
  )
}
