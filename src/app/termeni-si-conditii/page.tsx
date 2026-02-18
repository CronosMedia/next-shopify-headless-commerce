'use client'
import { FileText } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function TermsPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Termeni și Condiții</h1>
            <p className="text-lg text-muted-foreground mb-8">Regulamentul de utilizare a site-ului</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Termeni Generali</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Bine ați venit pe Next Commerce. Vă rugăm să citiți cu atenție termenii și condițiile de utilizare a acestui site.
                                Accesarea și utilizarea acestui site implică acceptarea explicită a acestor termeni și condiții.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">1. Definiții</h3>
                            <p>
                                <strong>Vânzător:</strong> Next Commerce SRL.<br />
                                <strong>Cumpărător:</strong> Orice persoană fizică sau juridică care plasează o comandă.<br />
                                <strong>Site:</strong> Magazinul online găzduit la adresa next-commerce.ro.
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
