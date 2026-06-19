'use client'
import { usePathname } from 'next/navigation'
import MainHeader from './MainHeader'

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <>
      {/* Spacer to push content below the fixed MainHeader on non-home pages */}
      {!isHome && <div className="h-[60px] lg:h-[72px]" aria-hidden="true" />}
      
      <MainHeader />
    </>
  )
}
