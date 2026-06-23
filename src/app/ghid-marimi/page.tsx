'use client'
import { HelpCircle } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

export default function SizeGuidePage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Ghid de Mărimi</h1>
            <p className="legal-page-subtitle">Alege mărimea potrivită pentru tine</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <HelpCircle />
                            <h2>Cum să te măsori</h2>
                        </div>

                        <div className="legal-copy">
                            <p>
                                Pentru a alege mărimea corectă, îți recomandăm să te măsori folosind un centimetru de croitorie, purtând lejer hainele.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Tabel Mărimi (cm)</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="uppercase tracking-wider border-b border-[var(--border)] bg-[var(--secondary)]/60">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Mărime</th>
                                            <th scope="col" className="px-6 py-4">Bust</th>
                                            <th scope="col" className="px-6 py-4">Talie</th>
                                            <th scope="col" className="px-6 py-4">Șolduri</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]/60">
                                        <tr>
                                            <td className="px-6 py-4 font-medium">XS</td>
                                            <td className="px-6 py-4">80-84</td>
                                            <td className="px-6 py-4">60-64</td>
                                            <td className="px-6 py-4">86-90</td>
                                        </tr>
                                        <tr className="bg-[var(--secondary)]/35">
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
                                        <tr className="bg-[var(--secondary)]/35">
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
