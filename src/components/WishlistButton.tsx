'use client'

import { Heart } from 'lucide-react'
import { useWishlist, WishlistItem } from './WishlistProvider'
import { cn } from '@/lib/utils'

export default function WishlistButton({
    item,
    className,
    variant = 'default',
}: {
    item: WishlistItem
    className?: string
    variant?: 'default' | 'icon'
}) {
    const { isInWishlist, toggleItem } = useWishlist()
    const isSaved = isInWishlist(item.id)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleItem(item)
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                className={cn(
                    'flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100',
                    isSaved ? 'text-red-500 hover:bg-red-50' : 'text-gray-600',
                    className
                )}
                aria-label={isSaved ? 'Elimină de la favorite' : 'Adaugă la favorite'}
            >
                <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                'w-full h-14 flex items-center justify-center gap-3 text-[13px] md:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer rounded-none border',
                isSaved
                    ? 'border-red-500 bg-red-50/40 text-red-600 hover:bg-red-50'
                    : 'border-[var(--border)] text-neutral-800 hover:bg-neutral-50 hover:border-black',
                className
            )}
        >
            <Heart
                size={16}
                className={cn(
                    "transition-transform duration-300",
                    isSaved ? "fill-red-500 text-red-500 scale-110" : "fill-transparent text-current"
                )}
            />
            <span>{isSaved ? 'Salvat la favorite' : 'Adaugă la favorite'}</span>
        </button>
    )
}
