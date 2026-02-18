'use client'
import { HelpCircle } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function SizeGuidePage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Ghid de Mărimi</h1>
            <p className="text-lg text-muted-foreground mb-8">Alege mărimea potrivită pentru tine</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <HelpCircle className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Cum să te măsori</h2>
                        </div>

                        <div className="prose max-w-none text-muted-foreground space-y-4">
                            <p>
                                Pentru a alege mărimea corectă, îți recomandăm să te măsori folosind un centimetru de croitorie, purtând lejer hainele.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Tabel Mărimi (cm)</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-secondary/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Mărime</th>
                                            <th scope="col" className="px-6 py-4">Bust</th>
                                            <th scope="col" className="px-6 py-4">Talie</th>
                                            <th scope="col" className="px-6 py-4">Șolduri</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-6 py-4 font-medium">XS</td>
                                            <td className="px-6 py-4">80-84</td>
                                            <td className="px-6 py-4">60-64</td>
                                            <td className="px-6 py-4">86-90</td>
                                        </tr>
                                        <tr className="bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium">S</td>
                                            <td className="px-6 py-4">84-88</td>
                                            <td className="px-6 py-4">64-68</td>
                                            <td className="px-6 py-4">90-94</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-medium">M</td>
                                            <td className="px-6 py-4">88-92</td>
                                            <td className="px-6 py-4">68-72</td>
                                            <td className="px-6 py-4">94-98</td>
                                        </tr>
                                        <tr className="bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium">L</td>
                                            <td className="px-6 py-4">92-96</td>
                                            <td className="px-6 py-4">72-76</td>
                                            <td className="px-6 py-4">98-102</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-medium">XL</td>
                                            <td className="px-6 py-4">96-100</td>
                                            <td className="px-6 py-4">76-80</td>
                                            <td className="px-6 py-4">102-106</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-sm mt-4 italic">
                                *Măsurătorile sunt orientative și pot varia în funcție de modelul și croiala produsului.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
