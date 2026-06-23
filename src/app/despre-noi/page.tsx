'use client'
import { HelpCircle } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function AboutPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Despre Noi</h1>
            <p className="legal-page-subtitle">Povestea și misiunea Maison Outdoor</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <HelpCircle />
                            <h2>Cine suntem?</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Maison Outdoor este mai mult decât un magazin online. Suntem o echipă pasionată de calitate și aventură, dedicată să aducă cel mai bun echipament tehnic de camping și hiking direct la tine.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Misiunea Noastră</h3>
                            <p>
                                Misiunea noastră este să oferim o experiență de cumpărături online simplă, sigură și plăcută. Selectăm cu atenție fiecare produs din portofoliul nostru pentru a ne asigura că respectă cele mai înalte standarde de calitate.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Valorile Noastre</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Calitate:</strong> Nu facem compromisuri când vine vorba de calitatea produselor.</li>
                                <li><strong>Integritate:</strong> Suntem transparenți și cinstiți în tot ceea ce facem.</li>
                                <li><strong>Clientul pe primul loc:</strong> Satisfacția ta este prioritatea noastră numărul 1.</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
