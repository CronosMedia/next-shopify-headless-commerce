'use client'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronDown,
  ChevronRight,
  Package,
  Heart,
  Zap,
  Leaf,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import MegaFilterPanel from './MegaFilterPanel'

const categoryIcons = {
  supplements: Package,
  vitamins: Heart,
  protein: Zap,
  organic: Leaf,
  beauty: Sparkles,
  default: Package,
}

export default function MegaMenu({
  title = 'Categorii',
  align = 'left',
}: {
  title?: string
  align?: 'left' | 'right' | 'center'
}) {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Hardcoded filter data (mimicking Shopify API response)
  const filterData = {
    suplimente: [
      {
        title: 'Tip Supliment',
        links: [
          { name: 'Proteine', href: '/collections/suplimente?filter=proteine' },
          { name: 'Creatină', href: '/collections/suplimente?filter=creatina' },
          { name: 'Vitamine', href: '/collections/suplimente?filter=vitamine' },
        ],
      },
      {
        title: 'Obiectiv',
        links: [
          {
            name: 'Masă Musculară',
            href: '/collections/suplimente?filter=masa-musculara',
          },
          { name: 'Slăbire', href: '/collections/suplimente?filter=slabire' },
          { name: 'Energie', href: '/collections/suplimente?filter=energie' },
        ],
      },
    ],
    vitamine: [
      {
        title: 'Tip Vitamină',
        links: [
          {
            name: 'Vitamina C',
            href: '/collections/vitamine?filter=vitamina-c',
          },
          {
            name: 'Vitamina D',
            href: '/collections/vitamine?filter=vitamina-d',
          },
        ],
      },
    ],
    // Add more categories and their filters as needed
  }
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections')
        if (response.ok) {
          const data = await response.json()
          setCollections(data.collections || [])
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsHovering(true)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Delay de 150ms pentru a permite mouse-ului să se miște
  }

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsHovering(true)
  }

  const handleMenuMouseLeave = () => {
    setIsHovering(false)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (loading || !collections.length) return null

  return (
    <div
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 font-barlow text-base font-normal text-gray-700 leading-normal transition-colors cursor-pointer hover:text-black">
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute mt-2 bg-gray-100 shadow-xl mx-2  z-50 animate-in fade-in-0 zoom-in-95 duration-200 w-[400px] ${
            align === 'left'
              ? 'left-0'
              : align === 'right'
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2'
          }`}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="flex flex-col">
            {collections.map((c: any) => {
              const IconComponent =
                categoryIcons[
                  c.handle?.toLowerCase() as keyof typeof categoryIcons
                ] || categoryIcons.default
              return (
                <Link
                  key={c.id}
                  href={`/collections/${c.handle}`}
                  className="flex items-center justify-between py-4 border-b border-gray-300 last:border-b-0 transition-colors group/link hover:bg-gray-200 px-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-barlow text-base font-normal text-gray-700 leading-normal block">
                      {c.title}
                    </span>
                    {c.description && (
                      <span className="text-xs text-gray-500 line-clamp-2 mt-1 block">
                        {c.description}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-500" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
