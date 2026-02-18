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
                aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2 border rounded transition-colors',
                isSaved
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                className
            )}
        >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Salvat' : 'Wishlist'}</span>
        </button>
    )
}
