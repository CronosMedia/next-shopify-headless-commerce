'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import Image from 'next/image'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  message: string
  productTitle?: string
  productImage?: string
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastOptions | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((options: ToastOptions | string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const resolvedOptions: ToastOptions =
      typeof options === 'string'
        ? { message: options, type: 'success' }
        : { type: 'success', ...options }

    setActiveToast(resolvedOptions)

    const duration = resolvedOptions.duration || 4000
    timerRef.current = setTimeout(() => {
      setActiveToast(null)
    }, duration)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {activeToast && (
        <Toast toast={activeToast} onClose={() => setActiveToast(null)} />
      )}
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }: { toast: ToastOptions; onClose: () => void }) {
  const type = toast.type || 'success'

  const iconMap = {
    success: <CheckCircle2 className="text-green-600 shrink-0" size={18} />,
    error: <AlertCircle className="text-red-600 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-600 shrink-0" size={18} />,
    info: <Info className="text-blue-600 shrink-0" size={18} />,
  }

  const titleColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes toastIn {
            from { transform: translateY(-24px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes toastInDesktop {
            from { transform: translate(32px, 0); opacity: 0; }
            to { transform: translate(0, 0); opacity: 1; }
          }
          .animate-global-toast {
            animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @media (min-width: 640px) {
            .animate-global-toast {
              animation: toastInDesktop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          }
        `
      }} />
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_1rem)] z-[999] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:block sm:px-0">
        <div className="pointer-events-auto flex w-full max-w-[420px] select-none gap-4 rounded-none border border-neutral-200 bg-white/95 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] backdrop-blur-md sm:w-[380px] animate-global-toast">
          {toast.productImage ? (
            <div className="relative w-16 h-16 border border-neutral-200 shrink-0 overflow-hidden bg-white">
              <Image
                src={toast.productImage}
                alt={toast.productTitle || 'Produs'}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="pt-0.5">
              {iconMap[type]}
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className={`text-xs font-bold uppercase tracking-wider ${titleColorMap[type]}`}>
              {toast.message}
            </p>
            {toast.productTitle && (
              <p className="text-xs font-semibold text-neutral-800 mt-1 line-clamp-2 leading-snug">
                {toast.productTitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0 self-start p-0.5"
            aria-label="Închide"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
