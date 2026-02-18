'use client'
import {
    RefreshCcw
} from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function ReturnPolicyPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Politica de Retur</h1>
            <p className="text-lg text-muted-foreground mb-8">Informații despre returnarea produselor</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <RefreshCcw className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Retur Simplu și Rapid</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Înțelegem că uneori produsele comandate nu sunt exact ceea ce îți doreai. De aceea, la Next Commerce, îți oferim posibilitatea de a returna produsele în termen de <strong>14 zile calendaristice</strong> de la primirea coletului.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Condiții de Retur</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    Produsul trebuie să fie în aceeași stare în care a fost livrat (nou, nefolosit, fără urme de uzură).
                                </li>
                                <li>
                                    Produsul trebuie să fie în ambalajul original, cu toate accesoriile și etichetele intacte.
                                </li>
                                <li>
                                    Factura fiscală și certificatul de garanție (dacă este cazul) trebuie să însoțească produsul returnat.
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Cum procedez?</h3>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>
                                    Completează formularul de retur disponibil în contul tău sau contactează-ne la <strong>support@nextcommerce.com</strong>.
                                </li>
                                <li>
                                    Ambalează produsul corespunzător pentru a fi protejat pe timpul transportului.
                                </li>
                                <li>
                                    Un curier va veni să ridice coletul de la adresa indicată de tine.
                                </li>
                            </ol>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Rambursarea Banilor</h3>
                            <p>
                                Contravaloarea produselor returnate va fi rambursată în contul tău bancar în termen de maximum <strong>14 zile</strong> de la recepționarea și verificarea returului în depozitul nostru.
                            </p>
                            <p className="text-sm text-gray-500 italic">
                                *Costul transportului pentru retur este suportat de client (19.99 LEI), cu excepția cazurilor în care produsul a fost livrat greșit sau prezintă defecte de fabricație.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
