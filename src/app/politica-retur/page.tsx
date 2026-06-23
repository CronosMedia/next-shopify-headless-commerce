'use client'
import {
    RefreshCcw
} from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function ReturnPolicyPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Politica de Retur</h1>
            <p className="legal-page-subtitle">Informații despre returnarea produselor</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <RefreshCcw />
                            <h2>Retur Simplu și Rapid</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Înțelegem că uneori produsele comandate nu sunt exact ceea ce îți doreai. De aceea, la Maison Outdoor, îți oferim posibilitatea de a returna produsele în termen de <strong>14 zile calendaristice</strong> de la primirea coletului.
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
                                    Completează formularul de retur disponibil în contul tău sau contactează-ne la <strong>support@maisonoutdoor.ro</strong>.
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
                                *Costul transportului pentru retur este suportat de client (25 lei), cu excepția cazurilor în care produsul a fost livrat greșit sau prezintă defecte de fabricație.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
