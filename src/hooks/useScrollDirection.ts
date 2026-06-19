import { useState, useEffect } from 'react'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [isTop, setIsTop] = useState(true)

  useEffect(() => {
    // Initial checks using scrollY
    setIsTop(window.scrollY < 50)
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScroll = () => {
      const scrollY = window.scrollY
      
      // Always update isTop immediately on scroll
      setIsTop(scrollY < 50)

      // Only update scroll direction if moved by more than 10px
      if (Math.abs(scrollY - lastScrollY) >= 10) {
        setScrollDirection(scrollY > lastScrollY ? 'down' : 'up')
        lastScrollY = scrollY > 0 ? scrollY : 0
      }
      
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    // Next.js and browsers restore scroll position after mounting, so we run delayed checks
    const timer1 = setTimeout(updateScroll, 50)
    const timer2 = setTimeout(updateScroll, 150)
    const timer3 = setTimeout(updateScroll, 400)

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, []) // Empty dependency array to prevent re-registering and missing scroll events

  return { scrollDirection, isTop }
}

