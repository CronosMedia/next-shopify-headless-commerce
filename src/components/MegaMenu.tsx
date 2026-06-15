'use client'
import Link from 'next/link'
import {ChevronDown, ChevronRight} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

type Collection = {
  id: string
  handle: string
  title: string
  description?: string
}

export default function MegaMenu({
  title = 'Categorii',
  align = 'left',
}: {
  title?: string
  align?: 'left' | 'right' | 'center'
}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
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
      } catch {
        setCollections([])
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
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Delay de 150ms pentru a permite mouse-ului să se miște
  }

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleMenuMouseLeave = () => {
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
            {collections.map((c) => {
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
