'use client'
import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import {
    Truck,
    RefreshCcw,
    FileText,
    HelpCircle,
    ShieldCheck,
    Phone
} from 'lucide-react'

export function LegalSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const navRef = useRef<HTMLElement | null>(null)
    const [pendingHref, setPendingHref] = useState<string | null>(null)
    const navScrollStorageKey = 'legal-sidebar-scroll-left'
    const pageScrollStorageKey = 'legal-page-scroll-top'

    const links = [
        { href: '/livrare-gratuita', label: 'Livrare Gratuită', icon: Truck },
        { href: '/politica-retur', label: 'Politica de Retur', icon: RefreshCcw },
        { href: '/politica-confidentialitate', label: 'Politica de Confidențialitate', icon: ShieldCheck },
        { href: '/politica-cookie', label: 'Politica Cookie', icon: ShieldCheck },
        { href: '/termeni-si-conditii', label: 'Termeni și Condiții', icon: FileText },
        { href: '/ghid-marimi', label: 'Ghid Mărimi', icon: HelpCircle },
        { href: '/despre-noi', label: 'Despre Noi', icon: HelpCircle },
        { href: '/contact', label: 'Contact', icon: Phone },
        { href: '/help-center', label: 'Centru de Ajutor', icon: HelpCircle },
    ]

    useLayoutEffect(() => {
        const nav = navRef.current
        setPendingHref(null)

        if (!nav || !window.matchMedia('(max-width: 1023px)').matches) {
            return
        }

        const storedPageScrollTop = window.sessionStorage.getItem(pageScrollStorageKey)
        if (storedPageScrollTop !== null) {
            const pageScrollTop = Number(storedPageScrollTop)
            const restorePageScroll = () => {
                window.scrollTo({ top: pageScrollTop, behavior: 'instant' })
            }

            restorePageScroll()
            window.requestAnimationFrame(restorePageScroll)
            window.setTimeout(restorePageScroll, 160)
            window.sessionStorage.removeItem(pageScrollStorageKey)
        }

        const storedScrollLeft = window.sessionStorage.getItem(navScrollStorageKey)
        const hasStoredScrollLeft = storedScrollLeft !== null

        if (hasStoredScrollLeft) {
            nav.scrollLeft = Number(storedScrollLeft)
            window.sessionStorage.removeItem(navScrollStorageKey)
        }

        const activeLink = nav.querySelector('[aria-current="page"]')

        if (!(activeLink instanceof HTMLElement)) {
            return
        }

        const centeredLeft = activeLink.offsetLeft - (nav.clientWidth - activeLink.clientWidth) / 2
        const maxScrollLeft = nav.scrollWidth - nav.clientWidth
        const nextLeft = Math.max(0, Math.min(centeredLeft, maxScrollLeft))

        if (!hasStoredScrollLeft) {
            nav.scrollLeft = nextLeft
        }
    }, [pathname])

    const getCenteredScrollLeft = (nav: HTMLElement, link: HTMLElement) => {
        const centeredLeft = link.offsetLeft - (nav.clientWidth - link.clientWidth) / 2
        const maxScrollLeft = nav.scrollWidth - nav.clientWidth

        return Math.max(0, Math.min(centeredLeft, maxScrollLeft))
    }

    const handleMobileNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        const nav = navRef.current

        if (
            !nav ||
            !window.matchMedia('(max-width: 1023px)').matches ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
        ) {
            return
        }

        event.preventDefault()
        setPendingHref(href)

        const targetLink = event.currentTarget
        const nextLeft = getCenteredScrollLeft(nav, targetLink)

        nav.scrollTo({
            left: nextLeft,
            behavior: 'smooth',
        })

        window.sessionStorage.setItem(navScrollStorageKey, String(nextLeft))
        window.sessionStorage.setItem(pageScrollStorageKey, String(window.scrollY))

        if (href === pathname) {
            return
        }

        window.setTimeout(() => {
            router.push(href, { scroll: false })
        }, 180)
    }

    return (
        <aside className="legal-sidebar">
            <h2 className="legal-sidebar-title">Informații utile</h2>
            <nav ref={navRef} className="legal-sidebar-nav" aria-label="Navigație informații utile">
                {links.map((link) => {
                    const isActive = (pendingHref || pathname) === link.href
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            scroll={false}
                            onClick={(event) => handleMobileNavigation(event, link.href)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`legal-sidebar-link ${isActive ? 'legal-sidebar-link-active' : ''}`}
                        >
                            <Icon size={15} strokeWidth={1.5} className="legal-sidebar-icon" />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
