'use client'
import { ShieldCheck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function PrivacyPolicyPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Politica de Confidențialitate</h1>
            <p className="legal-page-subtitle">Cum prelucrăm și protejăm datele tale</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <ShieldCheck />
                            <h2>Protecția Datelor Tale</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Maison Outdoor respectă confidențialitatea datelor clienților noștri și ne angajăm să protejăm informațiile personale pe care ni le oferiți.
                                Această politică explică modul în care colectăm, utilizăm și păstrăm datele dumneavoastră.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Ce date colectăm?</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Informații de identificare (Nume, Prenume)</li>
                                <li>Informații de contact (Adresă de e-mail, Număr de telefon)</li>
                                <li>Adresa de livrare și facturare</li>
                                <li>Istoricul comenzilor</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Cum folosim datele?</h3>
                            <p>
                                Datele colectate sunt utilizate exclusiv pentru:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Procesarea și livrarea comenzilor.</li>
                                <li>Comunicarea statusului comenzii.</li>
                                <li>Îmbunătățirea serviciilor și a experienței de utilizare.</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Securitatea Datelor</h3>
                            <p>
                                Folosim măsuri tehnice și organizatorice adecvate pentru a proteja datele împotriva accesului neautorizat, a pierderii sau a distrugerii accidentale.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
