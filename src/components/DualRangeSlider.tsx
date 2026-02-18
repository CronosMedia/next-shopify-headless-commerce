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
        <div className="slider__track absolute h-[3px] w-full bg-gray-200 rounded-full"></div>
        <div ref={range} className="slider__range absolute h-[3px] rounded-full" style={{ backgroundColor: 'var(--primary, #006642)' }}></div>
      </div>

      <style jsx>{`
        .container {
          /* height: 100%; */
        }
        
        .slider {
          position: relative;
          width: 100%;
        }
        
        .slider__track,
        .slider__range {
          position: absolute;
        }

        /* Thumb Styles */
        .thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
        }

        .thumb--left {
          z-index: 3;
        }

        .thumb--right {
          z-index: 4;
        }

        /* Webkit Thumb */
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          background-color: white;
          border: 2px solid var(--primary, #006642);
          border-radius: 50%;
          cursor: pointer;
          height: 20px;
          width: 20px;
          margin-top: 2px;
          pointer-events: all;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .thumb::-webkit-slider-thumb:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transform: scale(1.1);
        }

        /* Mozilla Thumb */
        .thumb::-moz-range-thumb {
          background-color: white;
          border: 2px solid var(--primary, #006642);
          border-radius: 50%;
          cursor: pointer;
          height: 20px;
          width: 20px;
          pointer-events: all;
          position: relative;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        
        .thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(0, 102, 66, 0.15);
        }
      `}</style>
    </div>
  )
}

export default DualRangeSlider
