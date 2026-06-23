'use client'
import { ShieldCheck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function CookiePolicyPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Politica de Cookie-uri</h1>
            <p className="legal-page-subtitle">Despre utilizarea cookie-urilor</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <ShieldCheck />
                            <h2>Ce sunt cookie-urile?</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Un cookie este un fișier de mici dimensiuni, format din litere și numere, care va fi stocat pe computerul, terminalul mobil sau alte echipamente ale unui utilizator de pe care se accesează internetul.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">La ce sunt folosite?</h3>
                            <p>
                                Cookie-urile asigură utilizatorilor o experiență plăcută de navigare și susțin eforturile noastre pentru a oferi servicii confortabile utilizatorilor, de exemplu: preferințele în materie de confidențialitate online, coșul de cumpărături sau publicitate relevantă.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Cookie-uri utilizate</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Cookie-uri necesare:</strong> Esențiale pentru funcționarea site-ului.
                                </li>
                                <li>
                                    <strong>Cookie-uri de analiză:</strong> Ne ajută să înțelegem cum interacționează utilizatorii cu site-ul.
                                </li>
                                <li>
                                    <strong>Cookie-uri de marketing:</strong> Folosite pentru a livra anunțuri relevante.
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Gestionarea cookie-urilor</h3>
                            <p>
                                Puteți gestiona preferințele privind cookie-urile direct din setările browserului dumneavoastră.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
