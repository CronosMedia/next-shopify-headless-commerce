'use client'

import { useEffect } from 'react'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only activate smooth scrolling on desktop — never on mobile
        // to keep native touch scrolling and avoid intercepting pointer events
        if (typeof window === 'undefined' || window.innerWidth < 768) {
            return
        }

        let destroyed = false

        // Dynamic import — Lenis module is never loaded on mobile at all
        import('lenis').then(({ default: Lenis }) => {
            if (destroyed) return

            const lenis = new Lenis({
                duration: 1.5,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
            })

            function raf(time: number) {
                if (destroyed) return
                lenis.raf(time)
                requestAnimationFrame(raf)
            }

            requestAnimationFrame(raf)

            // Store destroy function for cleanup
            ;(window as unknown as Record<string, unknown>).__lenisDestroy = () => {
                destroyed = true
                lenis.destroy()
            }
        })

        return () => {
            destroyed = true
            const destroyFn = (window as unknown as Record<string, unknown>).__lenisDestroy as (() => void) | undefined
            if (destroyFn) {
                destroyFn()
                delete (window as unknown as Record<string, unknown>).__lenisDestroy
            }
        }
    }, [])

    return <>{children}</>
}
