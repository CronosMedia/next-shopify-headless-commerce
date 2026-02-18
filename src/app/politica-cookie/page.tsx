'use client'
import { ShieldCheck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function CookiePolicyPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Politica de Cookie-uri</h1>
            <p className="text-lg text-muted-foreground mb-8">Despre utilizarea cookie-urilor</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Ce sunt cookie-urile?</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Un cookie este un fișier de mici dimensiuni, format din litere și numere, care va fi stocat pe computerul, terminalul mobil sau alte echipamente ale unui utilizator de pe care se accesează internetul.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">La ce sunt folosite?</h3>
                            <p>
                                Cookie-urile asigură utilizatorilor o experiență plăcută de navigare și susțin eforturile noastre pentru a oferi servicii confortabile utilizatorilor: ex: – preferințele în materie de confidențialitate online, coșul de cumpărături sau publicitate relevantă.
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
