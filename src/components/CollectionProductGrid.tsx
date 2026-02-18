'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductCard from './ProductCard'
import DualRangeSlider from './DualRangeSlider'

type Product = {
    id: string
    handle: string
    title: string
    vendor: string
    productType: string
    tags: string[]
    featuredImage: {
        url: string
        altText: string
        width: number
        height: number
    } | null
    priceRange: {
        minVariantPrice: {
            amount: string
            currencyCode: string
        }
    }
    availableForSale: boolean
    variants: {
        edges: {
            node: {
                id: string
                availableForSale: boolean
            }
        }[]
    }
}

type SortOption = {
    label: string
    value: string
}

const SORT_OPTIONS: SortOption[] = [
    { label: 'Relevanță', value: 'relevance' },
    { label: 'Cele mai noi', value: 'newest' },
    { label: 'Preț crescător', value: 'price-asc' },
    { label: 'Preț descrescător', value: 'price-desc' },
    { label: 'Bestsellers', value: 'best-selling' },
]

type ActivePanel = 'sort' | 'availability' | 'price' | 'vendor' | 'type' | 'tags' | 'all' | null

export default function CollectionProductGrid({
    initialProducts,
    collectionTitle
}: {
    initialProducts: Product[]
    collectionTitle: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [loading, setLoading] = useState(false)

    // Active inline panel
    const [activePanel, setActivePanel] = useState<ActivePanel>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Calculate dynamic price range
    const prices = useMemo(() => products.map(p => parseFloat(p.priceRange.minVariantPrice.amount)), [products])
    const absoluteMin = useMemo(() => Math.floor(Math.min(...prices, 0)), [prices])
    const absoluteMax = useMemo(() => Math.ceil(Math.max(...prices, 1000)), [prices])

    // Extract unique values for dynamic filters
    const uniqueVendors = useMemo(() => {
        const vendors = products.map(p => p.vendor).filter(Boolean)
        return [...new Set(vendors)].sort()
    }, [products])

    const uniqueTypes = useMemo(() => {
        const types = products.map(p => p.productType).filter(Boolean)
        return [...new Set(types)].sort()
    }, [products])

    const uniqueTags = useMemo(() => {
        const tags = products.flatMap(p => p.tags || []).filter(Boolean)
        return [...new Set(tags)].sort()
    }, [products])

    // Filter states
    const currentSort = searchParams.get('sort') || 'relevance'
    const [inStockOnly, setInStockOnly] = useState(false)
    const [priceRange, setPriceRange] = useState<[number, number]>([absoluteMin, absoluteMax])
    const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

    // Update range when products load
    useEffect(() => {
        if (initialProducts.length > 0) {
            const newPrices = initialProducts.map(p => parseFloat(p.priceRange.minVariantPrice.amount))
            const newMin = Math.floor(Math.min(...newPrices))
            const newMax = Math.ceil(Math.max(...newPrices))
            if (newMin !== absoluteMin || newMax !== absoluteMax) {
                setPriceRange([newMin, newMax])
            }
        }
    }, [initialProducts])

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setActivePanel(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close panel on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActivePanel(null)
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', value)
        router.push(`?${params.toString()}`, { scroll: false })
        setLoading(true)
        setActivePanel(null)
    }

    useEffect(() => {
        setProducts(initialProducts)
        setLoading(false)
    }, [initialProducts])

    const togglePanel = useCallback((panel: ActivePanel) => {
        setActivePanel(prev => prev === panel ? null : panel)
    }, [])

    // Toggle helpers for multi-select
    const toggleSetItem = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, item: string) => {
        setFn(prev => {
            const next = new Set(prev)
            if (next.has(item)) next.delete(item)
            else next.add(item)
            return next
        })
    }

    // Filtered products
    const filteredProducts = products.filter(p => {
        if (inStockOnly && !p.availableForSale) return false
        const price = parseFloat(p.priceRange.minVariantPrice.amount)
        if (price < priceRange[0] || price > priceRange[1]) return false
        if (selectedVendors.size > 0 && !selectedVendors.has(p.vendor)) return false
        if (selectedTypes.size > 0 && !selectedTypes.has(p.productType)) return false
        if (selectedTags.size > 0 && !(p.tags || []).some(t => selectedTags.has(t))) return false
        return true
    })

    const isPriceFiltered = priceRange[0] > absoluteMin || priceRange[1] < absoluteMax
    const activeFilterCount = (inStockOnly ? 1 : 0) + (isPriceFiltered ? 1 : 0) + selectedVendors.size + selectedTypes.size + selectedTags.size
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label || 'Relevanță'

    const clearAllFilters = () => {
        setInStockOnly(false)
        setPriceRange([absoluteMin, absoluteMax])
        setSelectedVendors(new Set())
        setSelectedTypes(new Set())
        setSelectedTags(new Set())
    }

    // Reusable pill chip panel renderer
    const renderChipPanel = (
        items: string[],
        selected: Set<string>,
        setSelected: React.Dispatch<React.SetStateAction<Set<string>>>,
        emptyMessage: string
    ) => {
        if (items.length === 0) {
            return <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
        }
        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                    const isActive = selected.has(item)
                    return (
                        <button
                            key={item}
                            onClick={() => toggleSetItem(selected, setSelected, item)}
                            className={cn(
                                "h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200",
                                isActive
                                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                            )}
                        >
                            {item}
                            {isActive && <span className="ml-1.5">✓</span>}
                        </button>
                    )
                })}
            </div>
        )
    }

    // Which filter buttons are visible (only show if data exists)
    const showVendorFilter = uniqueVendors.length > 1
    const showTypeFilter = uniqueTypes.length > 1
    const showTagsFilter = uniqueTags.length > 0

    return (
        <div className="relative min-h-screen bg-white">

            {/* ─── FILTER BAR ─── */}
            <div className="sticky top-[56px] z-30 bg-white border-b border-gray-200/80" ref={panelRef}>
                <div className="w-full px-4 md:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-[52px]">

                        {/* Left: Results count */}
                        <div className="text-sm text-gray-500 hidden md:block">
                            <span className="text-gray-900 font-semibold">{filteredProducts.length}</span> produse
                        </div>

                        {/* Right: Filter controls */}
                        <div className="flex items-center gap-1.5 ml-auto overflow-x-auto scrollbar-none">

                            {/* Sort Button */}
                            <button
                                onClick={() => togglePanel('sort')}
                                className={cn(
                                    "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                    activePanel === 'sort'
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <ArrowUpDown size={14} />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
                                <span className="sm:hidden">Sortare</span>
                            </button>

                            {/* Divider */}
                            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block shrink-0" />

                            {/* Availability Button */}
                            <button
                                onClick={() => togglePanel('availability')}
                                className={cn(
                                    "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                    inStockOnly
                                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                        : activePanel === 'availability'
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                Disponibilitate
                                {inStockOnly && (
                                    <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/20 text-[10px] font-bold">✓</span>
                                )}
                            </button>

                            {/* Price Button */}
                            <button
                                onClick={() => togglePanel('price')}
                                className={cn(
                                    "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                    isPriceFiltered
                                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                        : activePanel === 'price'
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                Preț
                                {isPriceFiltered && (
                                    <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/20 text-[10px] font-bold">✓</span>
                                )}
                            </button>

                            {/* Vendor Button (dynamic) */}
                            {showVendorFilter && (
                                <button
                                    onClick={() => togglePanel('vendor')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                        selectedVendors.size > 0
                                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                            : activePanel === 'vendor'
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                    )}
                                >
                                    Brand
                                    {selectedVendors.size > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white/20 text-[11px] font-bold px-1.5">
                                            {selectedVendors.size}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Product Type Button (dynamic) */}
                            {showTypeFilter && (
                                <button
                                    onClick={() => togglePanel('type')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                        selectedTypes.size > 0
                                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                            : activePanel === 'type'
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                    )}
                                >
                                    Tip produs
                                    {selectedTypes.size > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white/20 text-[11px] font-bold px-1.5">
                                            {selectedTypes.size}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Tags Button (dynamic) */}
                            {showTagsFilter && (
                                <button
                                    onClick={() => togglePanel('tags')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                        selectedTags.size > 0
                                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                            : activePanel === 'tags'
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                    )}
                                >
                                    Etichete
                                    {selectedTags.size > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white/20 text-[11px] font-bold px-1.5">
                                            {selectedTags.size}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Divider */}
                            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block shrink-0" />

                            {/* All Filters Button */}
                            <button
                                onClick={() => togglePanel('all')}
                                className={cn(
                                    "relative flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full border transition-all duration-200 shrink-0",
                                    activePanel === 'all'
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <SlidersHorizontal size={14} />
                                Toate filtrele
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold px-1.5">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── INLINE DROPDOWN PANELS ─── */}

                {/* Sort Panel */}
                {activePanel === 'sort' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-4">
                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSortChange(option.value)}
                                        className={cn(
                                            "h-9 px-5 text-[13px] font-medium rounded-full border transition-all duration-200",
                                            currentSort === option.value
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Availability Panel */}
                {activePanel === 'availability' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <label className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors duration-300" />
                                    <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                    Doar produse în stoc
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Price Panel */}
                {activePanel === 'price' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-6">
                            <div className="max-w-md">
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-sm font-medium text-gray-700">Interval de preț</span>
                                    {isPriceFiltered && (
                                        <button
                                            onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                            className="text-xs text-[var(--primary)] font-medium hover:underline"
                                        >
                                            Resetează
                                        </button>
                                    )}
                                </div>

                                <div className="px-1 mb-6">
                                    <DualRangeSlider
                                        min={absoluteMin}
                                        max={absoluteMax}
                                        value={priceRange}
                                        onChange={setPriceRange}
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => {
                                                    const val = Math.min(Number(e.target.value), priceRange[1] - 1)
                                                    setPriceRange([val, priceRange[1]])
                                                }}
                                                className="w-full h-10 px-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Lei</span>
                                        </div>
                                    </div>
                                    <span className="text-gray-300 text-sm">—</span>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => {
                                                    const val = Math.max(Number(e.target.value), priceRange[0] + 1)
                                                    setPriceRange([priceRange[0], val])
                                                }}
                                                className="w-full h-10 px-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Lei</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendor Panel */}
                {activePanel === 'vendor' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Brand</span>
                                {selectedVendors.size > 0 && (
                                    <button onClick={() => setSelectedVendors(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueVendors, selectedVendors, setSelectedVendors, 'Nu există brand-uri disponibile.')}
                        </div>
                    </div>
                )}

                {/* Product Type Panel */}
                {activePanel === 'type' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tip produs</span>
                                {selectedTypes.size > 0 && (
                                    <button onClick={() => setSelectedTypes(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueTypes, selectedTypes, setSelectedTypes, 'Nu există tipuri de produs disponibile.')}
                        </div>
                    </div>
                )}

                {/* Tags Panel */}
                {activePanel === 'tags' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Etichete</span>
                                {selectedTags.size > 0 && (
                                    <button onClick={() => setSelectedTags(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueTags, selectedTags, setSelectedTags, 'Nu există etichete disponibile.')}
                        </div>
                    </div>
                )}

                {/* All Filters Panel (full-width slide-down) */}
                {activePanel === 'all' && (
                    <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                                {/* Availability */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Disponibilitate</h3>
                                    <label className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={inStockOnly}
                                                onChange={(e) => setInStockOnly(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors duration-300" />
                                            <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">Doar în stoc</span>
                                    </label>
                                </div>

                                {/* Price */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Preț (Lei)</h3>
                                        {isPriceFiltered && (
                                            <button
                                                onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                                className="text-xs text-[var(--primary)] font-medium hover:underline"
                                            >
                                                Resetează
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-1 mb-5">
                                        <DualRangeSlider min={absoluteMin} max={absoluteMax} value={priceRange} onChange={setPriceRange} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input type="number" value={priceRange[0]}
                                                    onChange={(e) => { const val = Math.min(Number(e.target.value), priceRange[1] - 1); setPriceRange([val, priceRange[1]]); }}
                                                    className="w-full h-10 px-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[var(--primary)] outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Lei</span>
                                            </div>
                                        </div>
                                        <span className="text-gray-300 text-sm">—</span>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input type="number" value={priceRange[1]}
                                                    onChange={(e) => { const val = Math.max(Number(e.target.value), priceRange[0] + 1); setPriceRange([priceRange[0], val]); }}
                                                    className="w-full h-10 px-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[var(--primary)] outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Lei</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor */}
                                {showVendorFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Brand</h3>
                                            {selectedVendors.size > 0 && (
                                                <button onClick={() => setSelectedVendors(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueVendors, selectedVendors, setSelectedVendors, '')}
                                    </div>
                                )}

                                {/* Product Type */}
                                {showTypeFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tip produs</h3>
                                            {selectedTypes.size > 0 && (
                                                <button onClick={() => setSelectedTypes(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueTypes, selectedTypes, setSelectedTypes, '')}
                                    </div>
                                )}

                                {/* Tags */}
                                {showTagsFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Etichete</h3>
                                            {selectedTags.size > 0 && (
                                                <button onClick={() => setSelectedTags(new Set())} className="text-xs text-[var(--primary)] font-medium hover:underline">Resetează</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueTags, selectedTags, setSelectedTags, '')}
                                    </div>
                                )}
                            </div>

                            {/* Actions row */}
                            <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                                >
                                    Șterge toate filtrele
                                </button>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="h-10 px-8 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors"
                                >
                                    Afișează {filteredProducts.length} produse
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay for panel */}
            {activePanel && (
                <div
                    className="fixed inset-0 bg-black/10 z-20 backdrop-blur-[1px] transition-opacity"
                    onClick={() => setActivePanel(null)}
                />
            )}

            {/* ─── ACTIVE FILTER CHIPS ─── */}
            {activeFilterCount > 0 && (
                <div className="w-full px-4 md:px-8 lg:px-12 py-3 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium mr-1">Filtre active:</span>
                        {inStockOnly && (
                            <button onClick={() => setInStockOnly(false)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors group">
                                În stoc <X size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        )}
                        {isPriceFiltered && (
                            <button onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors group">
                                {priceRange[0]} – {priceRange[1]} Lei <X size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        )}
                        {[...selectedVendors].map(v => (
                            <button key={`v-${v}`} onClick={() => toggleSetItem(selectedVendors, setSelectedVendors, v)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors group">
                                {v} <X size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        ))}
                        {[...selectedTypes].map(t => (
                            <button key={`t-${t}`} onClick={() => toggleSetItem(selectedTypes, setSelectedTypes, t)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors group">
                                {t} <X size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        ))}
                        {[...selectedTags].map(tag => (
                            <button key={`tag-${tag}`} onClick={() => toggleSetItem(selectedTags, setSelectedTags, tag)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors group">
                                {tag} <X size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        ))}
                        <button onClick={clearAllFilters}
                            className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors underline underline-offset-4 ml-1">
                            Șterge tot
                        </button>
                    </div>
                </div>
            )}

            {/* ─── PRODUCT GRID ─── */}
            <div className="w-full px-4 md:px-8 lg:px-12 py-8 pb-24">
                <div className={cn("relative transition-opacity duration-300", loading && "opacity-40 pointer-events-none")}>
                    {loading && (
                        <div className="absolute inset-0 flex h-64 items-center justify-center z-10">
                            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                        </div>
                    )}

                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                                <SlidersHorizontal size={24} className="text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">Niciun produs găsit</p>
                            <p className="text-sm text-gray-500 mb-6">Încearcă să ajustezi filtrele</p>
                            <button
                                onClick={clearAllFilters}
                                className="h-10 px-6 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors"
                            >
                                Resetează filtrele
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="md:hidden text-sm text-gray-500 mb-4">
                                <span className="text-gray-900 font-semibold">{filteredProducts.length}</span> produse
                            </div>
                            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10">
                                {filteredProducts.map((p) => (
                                    <li key={p.id} className="w-full">
                                        <ProductCard product={p} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
