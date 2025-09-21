'use client'
import { useMemo } from 'react'
import { Truck } from 'lucide-react'
import type { DeliveryOption } from '@/lib/types'

type DeliveryMethodSelectorProps = {
  options: DeliveryOption[]
  selectedOptionHandle: string | null
  onSelect: (handle: string) => void
}

export default function DeliveryMethodSelector({
  options,
  selectedOptionHandle,
  onSelect,
}: DeliveryMethodSelectorProps) {
  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div
          key={option.handle}
          onClick={() => onSelect(option.handle)}
          className={`p-4 border rounded-lg transition-colors ${
            selectedOptionHandle === option.handle
              ? 'border-green-600 bg-green-50 cursor-pointer'
              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-full ${
                selectedOptionHandle === option.handle
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}
            >
              <Truck
                size={24}
                className={
                  selectedOptionHandle === option.handle
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{option.title}</h3>
                <span className="font-medium">
                  {parseFloat(option.estimatedCost.amount) === 0 ? (
                    <span className="text-green-600">Gratuit</span>
                  ) : (
                    `${option.estimatedCost.amount} ${option.estimatedCost.currencyCode}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
