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
import { useAuth } from '@/components/AuthProvider'
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
    const { user } = useAuth();
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground">Salutare {user?.firstName || 'Oaspete'}!</h1>
            <p className="text-lg text-muted-foreground mb-8">Bine ai venit în Centrul de Ajutor!</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-12">
                    {/* FAQ Section */}
                    <section className="bg-card p-6 border border-gray-300 rounded-none space-y-8">
                        <h2 className="text-2xl font-semibold text-foreground border-b border-gray-300 pb-4 flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-primary" />
                            Întrebări frecvente
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-300 rounded-none overflow-hidden transition-all"
                                >
                                    <button
                                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-primary/5 text-primary">
                                                {faq.icon}
                                            </div>
                                            <span className="font-medium text-lg text-foreground">{faq.question}</span>
                                        </div>
                                        {openIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </button>
                                    {openIndex === index && (
                                        <div className="p-6 pt-0 text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 border-t border-gray-100 mt-4 pt-4">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="bg-card p-6 border border-gray-300 rounded-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">Încă mai ai nevoie de ajutor?</h2>
                                <p className="text-base text-muted-foreground">
                                    Dacă nu ai găsit răspunsul căutat, nu ezita să ne contactezi. Echipa noastră de suport este disponibilă de luni până vineri, între 09:00 și 18:00.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <a
                                    href="mailto:support@nextcommerce.com"
                                    className="flex items-center gap-4 p-4 border border-gray-300 hover:border-primary transition-colors group"
                                >
                                    <div className="p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Trimite-ne un e-mail</p>
                                        <p className="text-sm text-muted-foreground">support@nextcommerce.com</p>
                                    </div>
                                </a>
                                <a
                                    href="tel:+40700000000"
                                    className="flex items-center gap-4 p-4 border border-gray-300 hover:border-primary transition-colors group"
                                >
                                    <div className="p-3 bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <Phone className="w-6 h-6" />
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
