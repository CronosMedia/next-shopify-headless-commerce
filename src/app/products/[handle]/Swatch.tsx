'use client'

import { Check } from 'lucide-react'
import Image from 'next/image'
import type { CSSProperties } from 'react'

// Function to check if a string is a valid hex color
const isHexColor = (str: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str)
// Function to check if a string is a valid URL
const isURL = (str: string) => /^https?:\/\/\S+$/.test(str)

const isLightHexColor = (hexColor: string) => {
  const normalized = hexColor.length === 4
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
    : hexColor
  const hex = normalized.substring(1)
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5
}


type SwatchProps = {
  name: string
  value: string
  active: boolean
  onClick: () => void
  metafield?: { value: string } | null // Allow null for metafield
}

export default function Swatch({ name, value, active, onClick, metafield }: SwatchProps) {
  const lowerCaseName = name.toLowerCase()

  // Handle Color swatches
  if (lowerCaseName === 'color' || lowerCaseName === 'culoare') {
    const colorValue = metafield?.value || value
    const colorStyle: CSSProperties = isHexColor(colorValue)
      ? { backgroundColor: colorValue }
      : {}
    const hasColorSwatch = Boolean(colorStyle.backgroundColor)
    const hasImageSwatch = isURL(colorValue)

    if (!hasColorSwatch && !hasImageSwatch) {
      return (
        <button
          onClick={onClick}
          className={`min-w-12 h-10 px-4 rounded-none border text-xs font-medium tracking-[0.08em] transition-colors ${
            active
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-[var(--border)] hover:border-black'
          }`}
          aria-label={`Selectează ${value}`}
          title={value}
        >
          {value}
        </button>
      )
    }

    return (
      <button
        onClick={onClick}
        aria-label={`Selectează ${value}`}
        title={value}
        className={`w-6 h-6 rounded-full transition-all relative overflow-hidden border border-black/10 ${active ? 'ring-1 ring-offset-2 ring-[#1a1a1a]' : 'hover:scale-110'
          }`}
        style={colorStyle}
      >
        {hasImageSwatch ? (
          <Image
            src={colorValue}
            alt={value}
            width={32}
            height={32}
            className="h-full w-full rounded-full object-cover"
          />
        ) : null}
        {active && hasColorSwatch ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Check size={14} className={isLightHexColor(colorValue) ? 'text-black' : 'text-white'} />
          </span>
        ) : null}
        {active && hasImageSwatch ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Check size={14} className="text-white" />
          </span>
        ) : null}
        {hasColorSwatch && isLightHexColor(colorValue) ? (
          <span className="absolute inset-0 rounded-full border border-black/10" />
        ) : null}
      </button>
    )
  }

  // Handle Size or other text-based swatches
  return (
    <button
      onClick={onClick}
      className={`px-4 h-10 rounded-lg border text-base font-medium transition-colors ${active
          ? 'bg-black text-white border-black'
          : 'bg-white text-black hover:bg-gray-100'
        }`}
    >
      {value}
    </button>
  )
}
