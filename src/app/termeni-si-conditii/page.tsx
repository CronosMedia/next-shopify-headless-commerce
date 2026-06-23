'use client'
import { FileText } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function TermsPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Termeni și Condiții</h1>
            <p className="legal-page-subtitle">Regulamentul de utilizare a site-ului</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <FileText />
                            <h2>Termeni Generali</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Bine ați venit pe Maison Outdoor. Vă rugăm să citiți cu atenție termenii și condițiile de utilizare a acestui site.
                                Accesarea și utilizarea acestui site implică acceptarea explicită a acestor termeni și condiții.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">1. Definiții</h3>
                            <p>
                                <strong>Vânzător:</strong> Maison Outdoor SRL.<br />
                                <strong>Cumpărător:</strong> Orice persoană fizică sau juridică care plasează o comandă.<br />
                                <strong>Site:</strong> Magazinul online găzduit la adresa maisonoutdoor.ro.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">2. Comanda</h3>
                            <p>
                                Prin finalizarea comenzii, cumpărătorul consimte că toate datele furnizate sunt corecte, complete și adevărate.
                                Vânzătorul poate anula comanda dacă datele furnizate sunt incomplete sau incorecte.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">3. Prețuri</h3>
                            <p>
                                Toate prețurile afișate pe site includ TVA conform legislației în vigoare.
                                Prețul final plătit de client este format din prețul produsului + costul de livrare (dacă este cazul).
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">4. Dreptul de Retragere</h3>
                            <p>
                                Conform O.U.G. 34/2014, consumatorul are dreptul să notifice în scris comerciantul că renunță la cumpărare,
                                fără penalități și fără invocarea unui motiv, în termen de 14 zile calendaristice de la primirea produsului.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">5. Garanții</h3>
                            <p>
                                Toate produsele comercializate beneficiază de condiții de garanție conforme legislației în vigoare și politicilor comerciale ale producătorilor.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
