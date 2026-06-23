'use client'
import { useState } from 'react'
import {
    ChevronDown,
    ChevronUp,
    Mail,
    Phone,
    Truck,
    RefreshCcw,
    ShieldCheck,
    CreditCard,
    HelpCircle
} from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

const faqs = [
    {
        question: "Cum pot urmări comanda mea?",
        answer: "După ce comanda a fost expediată, vei primi un e-mail cu numărul de AWB și un link de urmărire. De asemenea, poți găsi aceste detalii în secțiunea 'Istoric Comenzi' din contul tău.",
        icon: <Truck className="w-5 h-5" />
    },
    {
        question: "Care este politica de retur?",
        answer: "Acceptăm retururi în termen de 14 zile de la primirea coletului, cu condiția ca produsele să fie în starea lor originală, sigilate și nefolosite. Pentru a iniția un retur, te rugăm să completezi formularul de contact.",
        icon: <RefreshCcw className="w-5 h-5" />
    },
    {
        question: "Ce metode de plată sunt acceptate?",
        answer: "Poți plăti online cu cardul (Visa, Mastercard), prin Apple Pay/Google Pay sau prin ramburs la livrare.",
        icon: <CreditCard className="w-5 h-5" />
    },
    {
        question: "Sunt datele mele în siguranță?",
        answer: "Da, folosim protocoale de securitate avansate și nu stocăm datele cardului tău bancar. Toate plățile online sunt procesate prin intermediul procesatorilor de plăți autorizați.",
        icon: <ShieldCheck className="w-5 h-5" />
    }
]

export default function HelpCenterPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Centru de Ajutor</h1>
            <p className="legal-page-subtitle">Răspunsuri rapide despre comenzi, livrare, retururi și siguranța datelor.</p>

            <div className="legal-layout">
                {/* Sidebar */}
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main space-y-8">
                    {/* FAQ Section */}
                    <section className="legal-content-card">
                        <div className="legal-section-heading legal-section-heading-plain">
                            <HelpCircle />
                            <h2>Întrebări frecvente</h2>
                        </div>
                        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="transition-all"
                                >
                                    <button
                                        className="w-full flex items-center justify-between gap-4 py-5 text-left hover:bg-[var(--secondary)]/35 transition-colors"
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="legal-faq-icon">
                                                {faq.icon}
                                            </div>
                                            <span className="font-medium text-base text-foreground leading-snug">{faq.question}</span>
                                        </div>
                                        {openIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </button>
                                    {openIndex === index && (
                                        <div className="pb-5 pl-11 pr-1 text-muted-foreground leading-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="legal-content-card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-xl font-normal tracking-[0.06em] uppercase text-foreground">Încă mai ai nevoie de ajutor?</h2>
                                <p className="text-base text-muted-foreground leading-8">
                                    Dacă nu ai găsit răspunsul căutat, nu ezita să ne contactezi. Echipa noastră de suport este disponibilă de luni până vineri, între 09:00 și 18:00.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <a
                                    href="mailto:support@nextcommerce.com"
                                    className="flex items-center gap-4 p-4 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors group bg-white"
                                >
                                    <div className="legal-icon-tile">
                                        <Mail />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Trimite-ne un e-mail</p>
                                        <p className="text-sm text-muted-foreground">support@nextcommerce.com</p>
                                    </div>
                                </a>
                                <a
                                    href="tel:+40700000000"
                                    className="flex items-center gap-4 p-4 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors group bg-white"
                                >
                                    <div className="legal-icon-tile">
                                        <Phone />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Sună-ne</p>
                                        <p className="text-sm text-muted-foreground">+40 700 000 000</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
