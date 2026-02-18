'use client'
import { Truck } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function FreeShippingPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Livrare Gratuită</h1>
            <p className="text-lg text-muted-foreground mb-8">Informații despre livrare și costuri</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Truck className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Politica de Livrare</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                La Next Commerce, ne dorim ca produsele tale să ajungă la tine cât mai rapid și în siguranță.
                                Colaborăm cu firme de curierat de top pentru a asigura o experiență de livrare excelentă.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Costuri de Livrare</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Livrare Gratuită:</strong> Pentru toate comenzile cu o valoare mai mare de <strong>300 LEI</strong>.
                                </li>
                                <li>
                                    <strong>Livrare Standard:</strong> Pentru comenzile sub 300 LEI, costul livrării este de <strong>19.99 LEI</strong>.
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
