'use client'
import { usePathname } from 'next/navigation'
import PromoBanner from './PromoBanner'
import MainHeader from './MainHeader'
import UtilityBar from './UtilityBar'

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <>
      {!isHome && <PromoBanner />}
      <MainHeader />
      {!isHome && <UtilityBar />}
    </>
  )
}
