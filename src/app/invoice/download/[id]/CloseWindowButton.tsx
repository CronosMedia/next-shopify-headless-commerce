'use client'

import Link from 'next/link'
import {useState} from 'react'

export function CloseWindowButton() {
  const [showFallback, setShowFallback] = useState(false)

  const handleClose = () => {
    window.close()

    window.setTimeout(() => {
      setShowFallback(true)
    }, 250)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClose}
        className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8ccd0] bg-white px-4 text-sm font-semibold text-[#374151] transition hover:bg-[#f7f8f9]"
      >
        Închide fila
      </button>
      {showFallback && (
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-[#0f766e] underline-offset-4 hover:underline"
        >
          Înapoi la admin
        </Link>
      )}
    </div>
  )
}
