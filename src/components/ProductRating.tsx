'use client'
import { Star, StarHalf } from 'lucide-react'

type ProductRatingProps = {
  rating?: number | null
  reviewCount?: number | null
  showStars?: boolean
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProductRating({
  rating = 4.5,
  reviewCount = 128,
  showStars = true,
  showCount = true,
  size = 'md',
}: ProductRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const safeRating = typeof rating === 'number' ? rating : 0
  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(safeRating)
    const hasHalfStar = safeRating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      )
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half"
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      )
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      )
    }

    return stars
  }

  return (
    <div
      className="flex items-center gap-2"
      itemScope
      itemType="https://schema.org/AggregateRating"
    >
      {showStars && (
        <div className="flex items-center gap-0.5">{renderStars()}</div>
      )}
      {showCount && (
        <div className="flex items-center gap-2">
          <span
            className={`${textSizeClasses[size]} font-medium text-gray-900`}
            itemProp="ratingValue"
          >
            {safeRating.toFixed(1)}
          </span>
          <span
            className={`${textSizeClasses[size]} text-gray-500`}
            itemProp="reviewCount"
          >
            ({reviewCount} reviews)
          </span>
        </div>
      )}
    </div>
  )
}
