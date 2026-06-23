'use client'
import { Truck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function FreeShippingPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Livrare Gratuită</h1>
            <p className="legal-page-subtitle">Informații despre livrare și costuri</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <Truck />
                            <h2>Politica de Livrare</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                La Maison Outdoor, ne dorim ca produsele tale să ajungă la tine cât mai rapid și în siguranță.
                                Colaborăm cu firme de curierat de top pentru a asigura o experiență de livrare excelentă.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Costuri de Livrare</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Livrare Gratuită:</strong> Pentru toate comenzile cu o valoare mai mare de <strong>500 lei</strong>.
                                </li>
                                <li>
                                    <strong>Livrare Standard:</strong> Pentru comenzile sub 500 lei, costul livrării este de <strong>25 lei</strong>.
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Timp de Livrare</h3>
                            <p>
                                Termenul estimat de livrare este de <strong>24-48 de ore</strong> lucrătoare de la confirmarea comenzii.
                                În perioadele aglomerate (Black Friday, Sărbători), timpul de livrare poate varia ușor.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Urmărirea Comenzii</h3>
                            <p>
                                Imediat ce coletul tău este predat curierului, vei primi un e-mail de confirmare care conține numărul de AWB și un link pentru urmărirea livrării.
                                De asemenea, poți verifica statusul comenzii oricând din contul tău de client.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
