'use client'

import { Star, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Review = {
    id: string
    author: string
    date: string
    rating: number
    title: string
    content: string
    verified: boolean
    likes: number
}

const MOCK_REVIEWS: Review[] = [
    {
        id: '1',
        author: 'Andrei Popescu',
        date: 'Acum 2 zile',
        rating: 5,
        title: 'Calitate excelentă',
        content: 'Materialul este foarte bun, se simte premium la atingere. Mărimea se potrivește perfect conform ghidului.',
        verified: true,
        likes: 3
    },
    {
        id: '2',
        author: 'Maria Ionescu',
        date: 'Acum o săptămână',
        rating: 5,
        title: 'Recomand cu drag',
        content: 'Livrarea a fost foarte rapidă, a ajuns a doua zi. Produsul arată exact ca în poze.',
        verified: true,
        likes: 1
    },
    {
        id: '3',
        author: 'Radu M.',
        date: 'Acum 2 săptămâni',
        rating: 4,
        title: 'Bun, dar puțin larg',
        content: 'Produsul este de calitate, dar croiala este puțin mai largă decât mă așteptam. Recomand o mărime mai mică dacă preferați slim fit.',
        verified: true,
        likes: 5
    }
]

export default function ReviewsSection() {
    const [reviews] = useState<Review[]>(MOCK_REVIEWS)

    return (
        <div className="space-y-8 py-4">
            {/* Summary Header */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-gray-50 p-6 rounded-xl">
                <div className="text-center md:text-left space-y-2">
                    <div className="text-5xl font-bold text-gray-900">4.8</div>
                    <div className="flex gap-1 justify-center md:justify-start text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={20} fill="currentColor" stroke="none" />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Bazat pe 24 de recenzii</p>
                </div>

                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3 text-sm">
                            <span className="w-3 font-medium text-gray-600">{rating}</span>
                            <Star size={14} className="text-gray-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: rating === 5 ? '70%' : rating === 4 ? '20%' : rating === 3 ? '5%' : '2%' }}
                                />
                            </div>
                            <span className="w-8 text-right text-gray-500">
                                {rating === 5 ? '70%' : rating === 4 ? '20%' : rating === 3 ? '5%' : '2%'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col justify-center">
                    <button className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                        Scrie o recenzie
                    </button>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{review.author}</span>
                                {review.verified && (
                                    <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        ✓ Cumpărător verificat
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                        </div>

                        <div className="flex gap-1 text-yellow-400 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                    stroke={i < review.rating ? 'none' : 'currentColor'}
                                    className={i >= review.rating ? 'text-gray-300' : ''}
                                />
                            ))}
                        </div>

                        <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.content}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                                <ThumbsUp size={14} />
                                <span>Util ({review.likes})</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
