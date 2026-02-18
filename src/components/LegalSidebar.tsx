'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

    return (
        <div className="lg:col-span-1 border border-gray-300 rounded-none p-4 h-fit">
            <h2 className="text-xl font-semibold text-foreground mb-4">Informații Utile</h2>
            <nav className="divide-y divide-gray-300">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`w-full flex items-center gap-3 py-3 text-left transition-colors pl-4 cursor-pointer relative ${isActive
                                ? 'bg-secondary text-foreground'
                                : 'text-foreground hover:bg-secondary'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 h-full w-2 bg-gray-700 -left-4 transform origin-left transition-all duration-300 ease-in-out opacity-100 scale-x-100"></div>
                            )}
                            <link.icon size={20} className="ml-4" />
                            <span className={isActive ? 'font-medium' : ''}>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
