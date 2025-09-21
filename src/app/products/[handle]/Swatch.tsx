'use client'

import { Check } from 'lucide-react'
import Image from 'next/image' // Import Image component for image swatches

// A simple map for common color names to tailwind classes or hex values
const colorMap: Record<string, string> = {
  black: 'bg-black',
  white: 'bg-white border',
  gray: 'bg-gray-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  // Extended color map for more common colors
  brown: 'bg-amber-800',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  rose: 'bg-rose-500',
  'dark blue': 'bg-blue-800',
  'light blue': 'bg-blue-300',
  'dark green': 'bg-green-800',
  'light green': 'bg-green-300',
  'dark red': 'bg-red-800',
  'light red': 'bg-red-300',
  'dark gray': 'bg-gray-800',
  'light gray': 'bg-gray-300',
  maroon: 'bg-red-900',
  navy: 'bg-blue-900',
  olive: 'bg-lime-900',
  silver: 'bg-gray-400',
  gold: 'bg-amber-400',
  beige: 'bg-amber-100',
  charcoal: 'bg-gray-700',
  lavender: 'bg-indigo-300',
  turquoise: 'bg-teal-300',
  magenta: 'bg-fuchsia-600',
  cream: 'bg-amber-50',
  // Custom colors from Shopify (these can eventually be removed if all custom colors use metafields)
  ice: 'bg-blue-100', // Light blue/white
  dawn: 'bg-orange-200', // Soft orange/pink
  powder: 'bg-gray-300', // Light gray, like powder snow
  electric: 'bg-blue-600', // Vibrant blue
  sunset: 'bg-orange-500', // Orange/red
}

// Function to check if a string is a valid hex color
const isHexColor = (str: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
// Function to check if a string is a valid URL
const isURL = (str: string) => /^https?:\/\/\S+$/.test(str);


type SwatchProps = {
  name: string
  value: string
  active: boolean
  onClick: () => void
  metafield?: { value: string } | null // Allow null for metafield
}

export default function Swatch({ name, value, active, onClick, metafield }: SwatchProps) {
  const lowerCaseName = name.toLowerCase()
  const lowerCaseValue = value.toLowerCase()

  // Handle Color swatches
  if (lowerCaseName === 'color' || lowerCaseName === 'culoare') {
    let swatchContent: React.ReactNode;
    let backgroundColorStyle: React.CSSProperties = {};
    let isLightColor = false; // To determine checkmark color

    const metafieldValue = metafield?.value;

    if (metafieldValue) {
      if (isHexColor(metafieldValue)) {
        backgroundColorStyle = { backgroundColor: metafieldValue };
        // Determine if hex color is light or dark for checkmark visibility
        const hex = metafieldValue.substring(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Using luminance formula to determine perceived brightness
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        isLightColor = luminance > 0.5;
      } else if (isURL(metafieldValue)) {
        swatchContent = (
          <Image
            src={metafieldValue}
            alt={value}
            width={36} // Adjust size as needed
            height={36} // Adjust size as needed
            className="rounded-full object-cover"
          />
        );
      }
    }

    // Fallback to existing logic if no valid metafield value is used for content/style
    if (!swatchContent && !Object.keys(backgroundColorStyle).length) {
      const isHex = isHexColor(value);
      const colorClass = isHex ? '' : (colorMap[lowerCaseValue] || 'bg-gray-200');
      backgroundColorStyle = isHex ? { backgroundColor: value } : {};
      swatchContent = (
        <div className={`w-full h-full rounded-full flex items-center justify-center ${colorClass}`} style={backgroundColorStyle}>
          {active && (lowerCaseValue === 'white' || (isHex && parseInt(value.substring(1), 16) > 0xffffff / 2)) && <Check size={16} className="text-black" />}
          {active && !(lowerCaseValue === 'white' || (isHex && parseInt(value.substring(1), 16) > 0xffffff / 2)) && <Check size={16} className="text-white" />}
        </div>
      );
    } else if (!swatchContent) { // If background style is set by metafield hex, but no image content
        swatchContent = (
            <div className={`w-full h-full rounded-full flex items-center justify-center`} style={backgroundColorStyle}>
                {active && (isLightColor ? <Check size={16} className="text-black" /> : <Check size={16} className="text-white" />)}
            </div>
        );
    }


    return (
      <button
        onClick={onClick}
        aria-label={`Select ${value}`}
        title={value}
        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${ // Centering content
          active ? 'border-black' : 'border-transparent'
        }`}
      >
        {swatchContent}
      </button>
    )
  }

  // Handle Size or other text-based swatches
  return (
    <button
      onClick={onClick}
      className={`px-4 h-10 rounded-lg border text-base font-medium transition-colors ${
        active
          ? 'bg-black text-white border-black'
          : 'bg-white text-black hover:bg-gray-100'
      }`}
    >
      {value}
    </button>
  )
}