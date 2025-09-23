'use client'

import { X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: 'confirmation' | 'info'
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirmation',
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-none w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          {type === 'confirmation' ? (
            <>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-none border-2 border-gray-300 text-lg cursor-pointer hover:bg-gray-300"
              >
                Anulează
              </button>
              <button
                onClick={onConfirm}
                className="bg-red-500 text-white px-6 py-3 rounded-none border-2 border-red-600 hover:bg-red-600 text-lg cursor-pointer"
              >
                Șterge
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-none border-2 border-gray-300 text-lg cursor-pointer hover:bg-gray-300"
            >
              Închide
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
