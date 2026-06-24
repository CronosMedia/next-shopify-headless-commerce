"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { filterSearchOptions } from "@/lib/ro-address"

type SearchableSelectProps = {
  value: string
  options: string[]
  placeholder: string
  disabled?: boolean
  name?: string
  className?: string
  inputClassName?: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
}

export function SearchableSelect({
  value,
  options,
  placeholder,
  disabled,
  name = "address-search-disabled",
  className = "",
  inputClassName,
  onChange,
  onSelect,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 256,
  })
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const filteredOptions = useMemo(() => filterSearchOptions(options, value), [options, value])
  const safeHighlightedIndex = Math.min(highlightedIndex, Math.max(filteredOptions.length - 1, 0))

  const defaultInputStyle = `border border-gray-200 rounded-lg py-2.5 text-sm focus:ring-2 focus:ring-black/20 focus:border-black ${
    value ? "pl-4" : "px-4"
  }`
  const activeInputStyle = inputClassName !== undefined ? inputClassName : defaultInputStyle
  const isRoundedNone = activeInputStyle.includes("rounded-none")
  const isTextXs = activeInputStyle.includes("text-xs")
  const isTextLg = activeInputStyle.includes("text-lg")

  const dropdownRoundness = isRoundedNone ? "rounded-none" : "rounded-lg"
  const optionRoundness = isRoundedNone ? "rounded-none" : "rounded-lg"
  const optionTextSize = isTextXs ? "text-xs" : isTextLg ? "text-lg" : "text-sm"
  const optionPadding = isTextXs ? "py-1.5 px-3" : isTextLg ? "py-2.5 px-4" : "py-2 px-3"
  const optionMinHeight = isTextXs ? "min-h-9" : isTextLg ? "min-h-12" : "min-h-11"

  const handleSelect = useCallback(
    (option: string) => {
      onSelect(option)
      setIsOpen(false)
      setHighlightedIndex(0)
    },
    [onSelect]
  )

  useEffect(() => {
    if (!isOpen || !wrapperRef.current) return

    const updateDropdownPosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportHeight = window.innerHeight
      const availableBelow = viewportHeight - rect.bottom - 16
      const availableAbove = rect.top - 16
      const shouldOpenAbove = availableBelow < 220 && availableAbove > availableBelow
      const maxHeight = Math.max(160, Math.min(320, shouldOpenAbove ? availableAbove : availableBelow))

      setDropdownStyle({
        top: shouldOpenAbove ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        maxHeight,
      })
    }

    updateDropdownPosition()
    window.addEventListener("resize", updateDropdownPosition)
    window.addEventListener("scroll", updateDropdownPosition, true)

    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
      window.removeEventListener("scroll", updateDropdownPosition, true)
    }
  }, [isOpen, filteredOptions.length])

  useEffect(() => {
    if (!isOpen) return
    optionRefs.current[safeHighlightedIndex]?.scrollIntoView({ block: "nearest" })
  }, [isOpen, safeHighlightedIndex])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        className={`w-full outline-none transition ${
          disabled
            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
            : "bg-white"
        } ${activeInputStyle} ${
          value ? "pr-10" : ""
        } ${className}`}
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        name={name}
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) setIsOpen(true)
        }}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120)
        }}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
        }}
        onKeyDown={(event) => {
          if (disabled || !filteredOptions.length) return

          if (event.key === "ArrowDown") {
            event.preventDefault()
            setIsOpen(true)
            setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1))
            return
          }

          if (event.key === "ArrowUp") {
            event.preventDefault()
            setIsOpen(true)
            setHighlightedIndex((prev) => Math.max(prev - 1, 0))
            return
          }

          if (event.key === "Enter" && isOpen) {
            event.preventDefault()
            handleSelect(filteredOptions[safeHighlightedIndex] || filteredOptions[0])
            return
          }

          if (event.key === "Escape") {
            setIsOpen(false)
          }
        }}
      />
      {!disabled && value ? (
        <button
          type="button"
          aria-label="Resetează câmpul"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
          onMouseDown={(event) => {
            event.preventDefault()
            onChange("")
            setIsOpen(false)
            setHighlightedIndex(0)
          }}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {typeof document !== "undefined" && isOpen && !disabled && filteredOptions.length > 0
        ? createPortal(
        <div
          className={`fixed z-[9999] overflow-hidden border border-neutral-200 bg-white shadow-xl ${dropdownRoundness}`}
          style={{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }}
        >
          <div
            className="h-full max-h-full overflow-y-auto overscroll-contain p-1 pr-2 [scrollbar-color:rgba(0,0,0,0.25)_transparent] [scrollbar-width:thin]"
            style={{ maxHeight: dropdownStyle.maxHeight }}
            onWheel={(event) => event.stopPropagation()}
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                type="button"
                role="option"
                aria-selected={safeHighlightedIndex === index}
                className={`flex w-full items-center text-left text-gray-900 transition ${optionMinHeight} ${optionRoundness} ${optionPadding} ${optionTextSize} ${
                  safeHighlightedIndex === index ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleSelect(option)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>,
        document.body
          )
        : null}
    </div>
  )
}
