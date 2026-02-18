'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccordionItemProps = {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-gray-200 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-black group"
            >
                <span className="text-lg font-medium text-gray-900 group-hover:text-black">{title}</span>
                <ChevronDown
                    className={cn(
                        'h-5 w-5 text-gray-500 transition-transform duration-300',
                        isOpen ? 'rotate-180' : ''
                    )}
                />
            </button>
            <div
                className={cn(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    isOpen ? 'max-h-[2000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                )}
            >
                <div className="text-gray-600 leading-relaxed text-[15px]">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default function AccordionGroup({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-t border-gray-200">
            {children}
        </div>
    )
}
