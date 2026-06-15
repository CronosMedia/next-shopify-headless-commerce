'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface DualRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  className?: string
}

const DualRangeSlider = ({ min, max, value, onChange, className }: DualRangeSliderProps) => {
  const [minVal, setMinVal] = useState(value[0])
  const [maxVal, setMaxVal] = useState(value[1])
  const minValRef = useRef(value[0])
  const maxValRef = useRef(value[1])
  const range = useRef<HTMLDivElement>(null)

  // Convert to percentage
  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  )

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal)
    const maxPercent = getPercent(maxValRef.current)

    if (range.current) {
      range.current.style.left = `${minPercent}%`
      range.current.style.width = `${maxPercent - minPercent}%`
    }
  }, [minVal, getPercent])

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current)
    const maxPercent = getPercent(maxVal)

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`
    }
  }, [maxVal, getPercent])

  // Update internal state when props change
  useEffect(() => {
    setMinVal(value[0])
    setMaxVal(value[1])
    minValRef.current = value[0]
    maxValRef.current = value[1]
  }, [value])

  return (
    <div className={cn("container relative w-full h-6 flex items-center justify-center pt-2", className)}>
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1)
          setMinVal(value)
          minValRef.current = value
          onChange([value, maxVal])
        }}
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1)
          setMaxVal(value)
          maxValRef.current = value
          onChange([minVal, value])
        }}
        className="thumb thumb--right"
      />

      <div className="slider relative w-full">
        <div className="slider__track absolute h-[2px] w-full bg-[var(--muted,#e8e6e1)]"></div>
        <div ref={range} className="slider__range absolute h-[2px]" style={{ backgroundColor: 'var(--foreground, #1a1a1a)' }}></div>
      </div>

      <style jsx>{`
        .slider {
          position: relative;
          width: 100%;
        }
        
        .slider__track,
        .slider__range {
          position: absolute;
        }

        .thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
        }

        .thumb--left { z-index: 3; }
        .thumb--right { z-index: 4; }

        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          background-color: var(--background, #faf9f7);
          border: 1.5px solid var(--foreground, #1a1a1a);
          border-radius: 50%;
          cursor: pointer;
          height: 16px;
          width: 16px;
          margin-top: 2px;
          pointer-events: all;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          transition: box-shadow 0.3s, transform 0.3s;
        }

        .thumb::-webkit-slider-thumb:hover {
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          transform: scale(1.05);
        }

        .thumb::-moz-range-thumb {
          background-color: var(--background, #faf9f7);
          border: 1.5px solid var(--foreground, #1a1a1a);
          border-radius: 50%;
          cursor: pointer;
          height: 16px;
          width: 16px;
          pointer-events: all;
          position: relative;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        
        .thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
        }
      `}</style>
    </div>
  )
}

export default DualRangeSlider
