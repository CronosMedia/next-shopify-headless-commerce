'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'
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
    { label: 'Relevanță', value: 'relevance' },
    { label: 'Cele mai noi', value: 'newest' },
    { label: 'Preț: crescător', value: 'price-asc' },
    { label: 'Preț: descrescător', value: 'price-desc' },
    { label: 'Cele mai vândute', value: 'best-selling' },
]

export default function CollectionProductGrid({
    initialProducts,
}: {
    initialProducts: Product[]
    collectionTitle: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currencyCode = initialProducts[0]?.priceRange?.minVariantPrice?.currencyCode || 'RON'
    const currencySymbol = useMemo(() => {
        const formatter = new Intl.NumberFormat(currencyCode.toUpperCase() === 'RON' ? 'ro-RO' : 'en-GB', { style: 'currency', currency: currencyCode })
        const parts = formatter.formatToParts(0)
        const symbolPart = parts.find(p => p.type === 'currency')
        return symbolPart ? symbolPart.value : currencyCode
    }, [currencyCode])

    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [loading, setLoading] = useState(false)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

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

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isFilterDrawerOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isFilterDrawerOpen])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFilterDrawerOpen(false)
                setIsSortDropdownOpen(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', value)
        router.push(`?${params.toString()}`, { scroll: false })
        setLoading(true)
        setIsSortDropdownOpen(false)
    }

    useEffect(() => {
        setProducts(initialProducts)
        setLoading(false)
    }, [initialProducts])

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

    // Luxury pill chip renderer
    const renderChipPanel = (
        items: string[],
        selected: Set<string>,
        setSelected: React.Dispatch<React.SetStateAction<Set<string>>>,
        emptyMessage: string
    ) => {
        if (items.length === 0) {
            return <p className="text-xs text-neutral-500 italic">{emptyMessage}</p>
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
                                "h-9 px-5 text-[11px] font-semibold tracking-[0.1em] uppercase border transition-all duration-300 cursor-pointer",
                                isActive
                                    ? "bg-black text-white border-black"
                                    : "bg-transparent text-neutral-800 border-neutral-300 hover:border-black hover:text-black"
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
            <div className="relative border-b border-[var(--border)] py-4 bg-[var(--background)] z-30">
                <div className="w-full px-4 md:px-8 lg:px-12">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Filter Toggle Button */}
                        <button
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase border border-neutral-300 hover:border-black transition-colors bg-white cursor-pointer"
                        >
                            <SlidersHorizontal size={12} strokeWidth={1.5} />
                            <span>Filtre</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 flex items-center justify-center min-w-[16px] h-[16px] bg-black text-white text-[9px] font-bold px-1 rounded-full">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Middle/Left: Results Count (on desktop) */}
                        <div className="text-[11px] tracking-[0.1em] uppercase text-neutral-500 hidden md:block">
                            <span className="text-black font-semibold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'produs' : 'produse'}
                        </div>

                        {/* Right: Sort Dropdown Trigger */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase border border-neutral-300 hover:border-black transition-colors bg-white cursor-pointer"
                            >
                                <ArrowUpDown size={12} strokeWidth={1.5} />
                                <span>Sortare<span className="hidden md:inline">: {currentSortLabel}</span></span>
                            </button>

                            {/* Sort Dropdown Panel */}
                            {isSortDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-1 w-56 bg-white border border-[var(--border)] shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="py-1">
                                            {SORT_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleSortChange(option.value)
                                                        setIsSortDropdownOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase hover:bg-neutral-50 transition-colors",
                                                        currentSort === option.value ? "text-[var(--accent)] font-semibold text-left" : "text-neutral-700 text-left"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── FILTER DRAWER ─── */}
            {isFilterDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsFilterDrawerOpen(false)}
                    />

                    {/* Drawer Container */}
                    <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[110] shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-bold tracking-[0.15em] uppercase text-neutral-900">Filtrează produsele</span>
                                {activeFilterCount > 0 && (
                                    <span className="text-[10px] font-medium text-neutral-500 lowercase tracking-normal normal-case">
                                        ({activeFilterCount} {activeFilterCount === 1 ? 'filtru activ' : 'filtre active'})
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsFilterDrawerOpen(false)}
                                className="text-neutral-500 hover:text-black transition-colors cursor-pointer p-1"
                                aria-label="Închide filtrele"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">
                            
                            {/* Disponibilitate (In Stock Only) */}
                            <div className="space-y-4">
                                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-900 block">Disponibilitate</span>
                                <label className="inline-flex items-center gap-3 cursor-pointer select-none group w-full">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={inStockOnly}
                                            onChange={(e) => setInStockOnly(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5.5 bg-neutral-200 border border-neutral-300 peer peer-checked:bg-black peer-checked:border-black transition-colors duration-300" />
                                        <div className="absolute left-[2px] top-[2px] w-[18px] h-[18px] bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-[18px]" />
                                    </div>
                                    <span className="text-[13px] font-semibold text-neutral-900 tracking-wide select-none">
                                        Doar în stoc
                                    </span>
                                </label>
                            </div>

                            {/* Preț (Price Slider) */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-900">Preț ({currencySymbol})</span>
                                    {isPriceFiltered && (
                                        <button
                                            onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                            className="text-[10px] tracking-wider uppercase text-neutral-600 font-bold hover:text-black transition-colors cursor-pointer"
                                        >
                                            Resetează
                                        </button>
                                    )}
                                </div>
                                <div className="px-1 py-2">
                                    <DualRangeSlider min={absoluteMin} max={absoluteMax} value={priceRange} onChange={setPriceRange} />
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
                                                className="w-full h-10 px-3 pr-8 text-xs font-semibold bg-transparent border border-neutral-300 text-neutral-900 focus:border-black outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-neutral-500 font-semibold">{currencySymbol}</span>
                                        </div>
                                    </div>
                                    <span className="text-neutral-400 text-xs">—</span>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => {
                                                    const val = Math.max(Number(e.target.value), priceRange[0] + 1)
                                                    setPriceRange([priceRange[0], val])
                                                }}
                                                className="w-full h-10 px-3 pr-8 text-xs font-semibold bg-transparent border border-neutral-300 text-neutral-900 focus:border-black outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-neutral-500 font-semibold">{currencySymbol}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Brand */}
                            {showVendorFilter && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-900">Brand</span>
                                        {selectedVendors.size > 0 && (
                                            <button
                                                onClick={() => setSelectedVendors(new Set())}
                                                className="text-[10px] tracking-wider uppercase text-neutral-600 font-bold hover:text-black transition-colors cursor-pointer"
                                            >
                                                Resetează
                                            </button>
                                        )}
                                    </div>
                                    {renderChipPanel(uniqueVendors, selectedVendors, setSelectedVendors, 'Nu există branduri.')}
                                </div>
                            )}

                            {/* Category */}
                            {showTypeFilter && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-900">Categorie</span>
                                        {selectedTypes.size > 0 && (
                                            <button
                                                onClick={() => setSelectedTypes(new Set())}
                                                className="text-[10px] tracking-wider uppercase text-neutral-600 font-bold hover:text-black transition-colors cursor-pointer"
                                            >
                                                Resetează
                                            </button>
                                        )}
                                    </div>
                                    {renderChipPanel(uniqueTypes, selectedTypes, setSelectedTypes, 'Nu există categorii.')}
                                </div>
                            )}

                            {/* Tags */}
                            {showTagsFilter && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-900">Etichete</span>
                                        {selectedTags.size > 0 && (
                                            <button
                                                onClick={() => setSelectedTags(new Set())}
                                                className="text-[10px] tracking-wider uppercase text-neutral-600 font-bold hover:text-black transition-colors cursor-pointer"
                                            >
                                                Resetează
                                            </button>
                                        )}
                                    </div>
                                    {renderChipPanel(uniqueTags, selectedTags, setSelectedTags, 'Nu există etichete.')}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-5 border-t border-neutral-200 bg-neutral-50 flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setIsFilterDrawerOpen(false)
                                }}
                                className="w-full h-12 bg-black text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-900 transition-colors cursor-pointer text-center flex items-center justify-center"
                            >
                                Afișează {filteredProducts.length} {filteredProducts.length === 1 ? 'produs' : 'produse'}
                            </button>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => {
                                        clearAllFilters()
                                        setIsFilterDrawerOpen(false)
                                    }}
                                    className="w-full py-2 text-[10px] tracking-[0.15em] uppercase text-neutral-700 hover:text-black font-bold transition-colors cursor-pointer text-center underline"
                                >
                                    Resetează toate filtrele
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ─── ACTIVE FILTER CHIPS ─── */}
            {activeFilterCount > 0 && (
                <div className="w-full px-4 md:px-8 lg:px-12 py-3 border-b border-[var(--border)]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted-foreground)] mr-1">Active:</span>
                        {inStockOnly && (
                            <button onClick={() => setInStockOnly(false)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                În stoc <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </button>
                        )}
                        {isPriceFiltered && (
                            <button onClick={() => setPriceRange([absoluteMin, absoluteMax])}
                                className="inline-flex items-center gap-1.5 h-7 px-3 bg-[var(--secondary)] text-[11px] font-light tracking-wide text-[var(--foreground)] transition-colors group">
                                {formatMoney(priceRange[0], currencyCode)} – {formatMoney(priceRange[1], currencyCode)} <X size={10} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
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
                            Șterge tot
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
                            <p className="text-lg font-light text-[var(--foreground)] mb-1">Nu s-au găsit produse</p>
                            <p className="text-sm font-light text-[var(--muted-foreground)] mb-8 tracking-wide">Încearcă să modifici filtrele</p>
                            <button onClick={clearAllFilters}
                                className="h-10 px-8 bg-[var(--foreground)] text-[var(--primary-foreground)] text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black transition-colors">
                                Resetează filtrele
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="md:hidden text-[11px] tracking-[0.1em] uppercase text-[var(--muted-foreground)] mb-6">
                                <span className="text-[var(--foreground)] font-medium">{filteredProducts.length}</span> produse
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
