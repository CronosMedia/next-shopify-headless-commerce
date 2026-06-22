'use client'

type PrintButtonProps = {
  documentTitle: string
}

export function PrintButton({documentTitle}: PrintButtonProps) {
  const handlePrint = () => {
    const previousTitle = document.title || 'Maison Outdoor'

    document.title = documentTitle
    window.print()

    window.setTimeout(() => {
      document.title = previousTitle
    }, 1000)
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex h-10 items-center justify-center rounded-md bg-[#202223] px-4 text-sm font-semibold text-white transition hover:bg-[#34373a]"
    >
      Printează / Salvează PDF
    </button>
  )
}
