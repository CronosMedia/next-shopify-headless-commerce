'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = {
  name: string
  href: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={14} />}
            {index === items.length - 1 ? (
              <span className="font-medium text-gray-800">{item.name}</span>
            ) : (
              <Link href={item.href} className="hover:text-gray-800 transition-colors">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
