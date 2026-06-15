'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'
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
        altText: string | null
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
    { label: 'Relevance', value: 'relevance' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Bestsellers', value: 'best-selling' },
]

type ActivePanel = 'sort' | 'availability' | 'price' | 'vendor' | 'type' | 'tags' | 'all' | null

export default function CollectionProductGrid({
    initialProducts,
}: {
    initialProducts: Product[]
    collectionTitle: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [loading, setLoading] = useState(false)
    const [activePanel, setActivePanel] = useState<ActivePanel>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Dynamic price range
    const prices = useMemo(() => products.map(p => parseFloat(p.priceRange.minVariantPrice.amount)), [products])
    const absoluteMin = useMemo(
        () => prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
        [prices]
    )
    const absoluteMax = useMemo(
        () => prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0,
        [prices]
    )

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

    useEffect(() => {
        setPriceRange([absoluteMin, absoluteMax])
    }, [absoluteMax, absoluteMin, initialProducts])

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
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label || 'Relevance'

    const clearAllFilters = () => {
        setInStockOnly(false)
        setPriceRange([absoluteMin, absoluteMax])
        setSelectedVendors(new Set())
        setSelectedTypes(new Set())
        setSelectedTags(new Set())
    }

    // Luxury pill chip renderer
    const renderChipPanel = (
        items: string[],
        selected: Set<string>,
        setSelected: React.Dispatch<React.SetStateAction<Set<string>>>,
        emptyMessage: string
    ) => {
        if (items.length === 0) {
            return <p className="text-xs text-[var(--muted-foreground)] italic">{emptyMessage}</p>
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
                                "h-9 px-5 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300",
                                isActive
                                    ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                    : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                            )}
                        >
                            {item}
                        </button>
                    )
                })}
            </div>
        )
    }

    const showVendorFilter = uniqueVendors.length > 1
    const showTypeFilter = uniqueTypes.length > 1
    const showTagsFilter = uniqueTags.length > 0

    return (
        <div className="relative min-h-screen bg-[var(--background)]">

            {/* ─── FILTER BAR ─── */}
            <div className="sticky top-[72px] z-30 bg-[var(--background)] border-b border-[var(--border)]" ref={panelRef}>
                <div className="w-full px-4 md:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-[52px]">

                        {/* Left: Results count */}
                        <div className="text-[11px] tracking-[0.1em] uppercase text-[var(--muted-foreground)] hidden md:block">
                            <span className="text-[var(--foreground)] font-medium">{filteredProducts.length}</span> products
                        </div>

                        {/* Right: Filter controls */}
                        <div className="flex items-center gap-2 ml-auto overflow-x-auto scrollbar-none">

                            {/* Sort */}
                            <button
                                onClick={() => togglePanel('sort')}
                                className={cn(
                                    "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                    activePanel === 'sort'
                                        ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                        : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <ArrowUpDown size={12} strokeWidth={1.5} />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
                                <span className="sm:hidden">Sort</span>
                            </button>

                            <div className="w-px h-4 bg-[var(--border)] mx-1 hidden sm:block shrink-0" />

                            {/* Availability */}
                            <button
                                onClick={() => togglePanel('availability')}
                                className={cn(
                                    "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                    inStockOnly
                                        ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                        : activePanel === 'availability'
                                            ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                            : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                )}
                            >
                                Availability
                            </button>

                            {/* Price */}
                            <button
                                onClick={() => togglePanel('price')}
                                className={cn(
                                    "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                    isPriceFiltered
                                        ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                        : activePanel === 'price'
                                            ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                            : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                )}
                            >
                                Price
                            </button>

                            {/* Brand */}
                            {showVendorFilter && (
                                <button
                                    onClick={() => togglePanel('vendor')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                        selectedVendors.size > 0
                                            ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                            : activePanel === 'vendor'
                                                ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                                : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    Brand
                                    {selectedVendors.size > 0 && (
                                        <span className="ml-1 text-[10px]">({selectedVendors.size})</span>
                                    )}
                                </button>
                            )}

                            {/* Type */}
                            {showTypeFilter && (
                                <button
                                    onClick={() => togglePanel('type')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                        selectedTypes.size > 0
                                            ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                            : activePanel === 'type'
                                                ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                                : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    Category
                                    {selectedTypes.size > 0 && (
                                        <span className="ml-1 text-[10px]">({selectedTypes.size})</span>
                                    )}
                                </button>
                            )}

                            {/* Tags */}
                            {showTagsFilter && (
                                <button
                                    onClick={() => togglePanel('tags')}
                                    className={cn(
                                        "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                        selectedTags.size > 0
                                            ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                            : activePanel === 'tags'
                                                ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                                : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    Tags
                                    {selectedTags.size > 0 && (
                                        <span className="ml-1 text-[10px]">({selectedTags.size})</span>
                                    )}
                                </button>
                            )}

                            <div className="w-px h-4 bg-[var(--border)] mx-1 hidden sm:block shrink-0" />

                            {/* All Filters */}
                            <button
                                onClick={() => togglePanel('all')}
                                className={cn(
                                    "relative flex items-center gap-2 h-8 px-4 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300 shrink-0",
                                    activePanel === 'all'
                                        ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                        : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <SlidersHorizontal size={12} strokeWidth={1.5} />
                                All Filters
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-[var(--accent)] text-white text-[9px] font-medium px-1">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── INLINE PANELS ─── */}

                {/* Sort */}
                {activePanel === 'sort' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSortChange(option.value)}
                                        className={cn(
                                            "h-9 px-5 text-[11px] font-medium tracking-[0.1em] uppercase border transition-all duration-300",
                                            currentSort === option.value
                                                ? "bg-[var(--foreground)] text-[var(--primary-foreground)] border-[var(--foreground)]"
                                                : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Availability */}
                {activePanel === 'availability' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <label className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--muted)] peer peer-checked:bg-[var(--foreground)] transition-colors duration-300" />
                                    <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                                </div>
                                <span className="text-sm font-light text-[var(--foreground)] tracking-wide">
                                    In stock only
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Price */}
                {activePanel === 'price' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-6">
                            <div className="max-w-md">
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Price Range</span>
                                    {isPriceFiltered && (
                                        <button onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                            className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="px-1 mb-6">
                                    <DualRangeSlider min={absoluteMin} max={absoluteMax} value={priceRange} onChange={setPriceRange} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input type="number" value={priceRange[0]}
                                                onChange={(e) => { const val = Math.min(Number(e.target.value), priceRange[1] - 1); setPriceRange([val, priceRange[1]]); }}
                                                className="w-full h-10 px-3 pr-8 text-sm font-light bg-transparent border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--foreground)] outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)]">£</span>
                                        </div>
                                    </div>
                                    <span className="text-[var(--muted)] text-sm">—</span>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input type="number" value={priceRange[1]}
                                                onChange={(e) => { const val = Math.max(Number(e.target.value), priceRange[0] + 1); setPriceRange([priceRange[0], val]); }}
                                                className="w-full h-10 px-3 pr-8 text-sm font-light bg-transparent border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--foreground)] outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)]">£</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Brand */}
                {activePanel === 'vendor' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Brand</span>
                                {selectedVendors.size > 0 && (
                                    <button onClick={() => setSelectedVendors(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueVendors, selectedVendors, setSelectedVendors, 'No brands available.')}
                        </div>
                    </div>
                )}

                {/* Category */}
                {activePanel === 'type' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Category</span>
                                {selectedTypes.size > 0 && (
                                    <button onClick={() => setSelectedTypes(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueTypes, selectedTypes, setSelectedTypes, 'No categories available.')}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {activePanel === 'tags' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Tags</span>
                                {selectedTags.size > 0 && (
                                    <button onClick={() => setSelectedTags(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                )}
                            </div>
                            {renderChipPanel(uniqueTags, selectedTags, setSelectedTags, 'No tags available.')}
                        </div>
                    </div>
                )}

                {/* All Filters */}
                {activePanel === 'all' && (
                    <div className="absolute left-0 right-0 top-full bg-[var(--background)] border-b border-[var(--border)] shadow-sm z-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="w-full px-4 md:px-8 lg:px-12 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

                                {/* Availability */}
                                <div>
                                    <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)] mb-5">Availability</h3>
                                    <label className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                        <div className="relative">
                                            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-[var(--muted)] peer peer-checked:bg-[var(--foreground)] transition-colors duration-300" />
                                            <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                                        </div>
                                        <span className="text-sm font-light text-[var(--foreground)]">In stock only</span>
                                    </label>
                                </div>

                                {/* Price */}
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Price (£)</h3>
                                        {isPriceFiltered && (
                                            <button onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                                className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
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
                                                    className="w-full h-10 px-3 pr-8 text-sm font-light bg-transparent border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--foreground)] outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)]">£</span>
                                            </div>
                                        </div>
                                        <span className="text-[var(--muted)] text-sm">—</span>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input type="number" value={priceRange[1]}
                                                    onChange={(e) => { const val = Math.max(Number(e.target.value), priceRange[0] + 1); setPriceRange([priceRange[0], val]); }}
                                                    className="w-full h-10 px-3 pr-8 text-sm font-light bg-transparent border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--foreground)] outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)]">£</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand */}
                                {showVendorFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Brand</h3>
                                            {selectedVendors.size > 0 && (
                                                <button onClick={() => setSelectedVendors(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueVendors, selectedVendors, setSelectedVendors, '')}
                                    </div>
                                )}

                                {/* Category */}
                                {showTypeFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Category</h3>
                                            {selectedTypes.size > 0 && (
                                                <button onClick={() => setSelectedTypes(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueTypes, selectedTypes, setSelectedTypes, '')}
                                    </div>
                                )}

                                {/* Tags */}
                                {showTagsFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Tags</h3>
                                            {selectedTags.size > 0 && (
                                                <button onClick={() => setSelectedTags(new Set())} className="text-[11px] tracking-wider uppercase text-[var(--accent)] font-medium hover:underline underline-offset-4">Reset</button>
                                            )}
                                        </div>
                                        {renderChipPanel(uniqueTags, selectedTags, setSelectedTags, '')}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
                                <button onClick={clearAllFilters}
                                    className="text-[11px] tracking-[0.1em] uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium transition-colors underline underline-offset-4">
                                    Clear all
                                </button>
                                <button onClick={() => setActivePanel(null)}
                                    className="h-10 px-10 bg-[var(--foreground)] text-[var(--primary-foreground)] text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black transition-colors">
                                    Show {filteredProducts.length} products
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay */}
            {activePanel && (
                <div className="fixed inset-0 bg-black/5 z-20 transition-opacity" onClick={() => setActivePanel(null)} />
            )}

            {/* ─── ACTIVE FILTER CHIPS ─── */}
            {activeFilterCount > 0 && (
                <div className="w-full px-4 md:px-8 lg:px-12 py-3 border-b border-[var(--border)]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted-foreground)] mr-1">Active:</span>
                        {inStockOnly && (
                            <button onClick={() => setInStockOnly(false)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                In stock <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        )}
                        {isPriceFiltered && (
                            <button onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                £{priceRange[0]} – £{priceRange[1]} <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        )}
                        {[...selectedVendors].map(v => (
                            <button key={`v-${v}`} onClick={() => toggleSetItem(selectedVendors, setSelectedVendors, v)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                {v} <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        ))}
                        {[...selectedTypes].map(t => (
                            <button key={`t-${t}`} onClick={() => toggleSetItem(selectedTypes, setSelectedTypes, t)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                {t} <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        ))}
                        {[...selectedTags].map(tag => (
                            <button key={`tag-${tag}`} onClick={() => toggleSetItem(selectedTags, setSelectedTags, tag)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                {tag} <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        ))}
                        <button onClick={clearAllFilters}
                            className="text-[10px] tracking-wider uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium transition-colors underline underline-offset-4 ml-1">
                            Clear all
                        </button>
                    </div>
                </div>
            )}

            {/* ─── PRODUCT GRID ─── */}
            <div className="w-full px-4 md:px-8 lg:px-12 py-10 pb-24">
                <div className={cn("relative transition-opacity duration-300", loading && "opacity-40 pointer-events-none")}>
                    {loading && (
                        <div className="absolute inset-0 flex h-64 items-center justify-center z-10">
                            <div className="w-6 h-6 border border-[var(--muted)] border-t-[var(--foreground)] rounded-full animate-spin" />
                        </div>
                    )}

                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <p className="text-lg font-light text-[var(--foreground)] mb-1">No products found</p>
                            <p className="text-sm font-light text-[var(--muted-foreground)] mb-8 tracking-wide">Try adjusting your filters</p>
                            <button onClick={clearAllFilters}
                                className="h-10 px-8 bg-[var(--foreground)] text-[var(--primary-foreground)] text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black transition-colors">
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="md:hidden text-[11px] tracking-[0.1em] uppercase text-[var(--muted-foreground)] mb-6">
                                <span className="text-[var(--foreground)] font-medium">{filteredProducts.length}</span> products
                            </div>
                            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
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
