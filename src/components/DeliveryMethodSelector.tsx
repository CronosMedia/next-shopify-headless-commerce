'use client'
import { Truck } from 'lucide-react'
import type { DeliveryOption } from '@/lib/types'
import { formatMoney } from '@/lib/utils'

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
          className={`p-4 border rounded-none transition-colors ${
            selectedOptionHandle === option.handle
              ? 'border-black bg-[#F9F8F6] cursor-pointer'
              : 'border-neutral-200 hover:border-neutral-400 cursor-pointer'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-none ${
                selectedOptionHandle === option.handle
                  ? 'bg-black/5'
                  : 'bg-neutral-100'
              }`}
            >
              <Truck
                size={24}
                className={
                  selectedOptionHandle === option.handle
                    ? 'text-black'
                    : 'text-neutral-500'
                }
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 text-xs md:text-sm">{option.title}</h3>
                <span className="font-bold text-neutral-900 text-xs md:text-sm">
                  {parseFloat(option.estimatedCost.amount) === 0 ? (
                    <span className="text-black">Gratuit</span>
                  ) : (
                    formatMoney(option.estimatedCost.amount, option.estimatedCost.currencyCode)
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
