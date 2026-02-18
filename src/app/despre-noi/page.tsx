'use client'
import { HelpCircle } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function AboutPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Despre Noi</h1>
            <p className="text-lg text-muted-foreground mb-8">Povestea și misiunea Next Commerce</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <HelpCircle className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Cine suntem?</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Next Commerce este mai mult decât un magazin online. Suntem o echipă pasionată de calitate și inovație, dedicată să aducă cele mai bune produse direct la tine acasă.
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
