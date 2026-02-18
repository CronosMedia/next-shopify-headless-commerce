'use client'
import { ShieldCheck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Politica de Confidențialitate</h1>
            <p className="text-lg text-muted-foreground mb-8">Cum prelucrăm și protejăm datele tale</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Protecția Datelor Tale</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Next Commerce respectă confidențialitatea datelor clienților noștri și ne angajăm să protejăm informațiile personale pe care ni le oferiți.
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
