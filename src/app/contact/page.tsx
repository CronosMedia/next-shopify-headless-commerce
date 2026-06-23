'use client'
import { useEffect, useState } from 'react'
import { Phone, Mail, MapPin, X } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'
import Link from 'next/link'

function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/45 backdrop-blur-xs"
                onClick={onClose}
                aria-label="Închide politica de confidențialitate"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="privacy-policy-modal-title"
                className="relative z-10 w-full max-w-xl bg-white border border-[var(--border)] shadow-2xl max-h-[86vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between gap-6 border-b border-[var(--border)] p-5 md:p-6">
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--muted-foreground)] mb-2">
                            Date personale
                        </p>
                        <h2 id="privacy-policy-modal-title" className="text-xl font-medium tracking-[0.04em] uppercase text-[var(--foreground)]">
                            Politica de Confidențialitate
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Închide"
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-5 md:p-6 space-y-5 text-sm leading-7 text-[var(--muted-foreground)]">
                    <p>
                        Datele transmise prin formular sunt folosite exclusiv pentru a putea răspunde solicitării tale.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Prelucrăm numele, adresa de e-mail și mesajul trimis.</li>
                        <li>Nu folosim aceste date pentru comunicări comerciale fără acord separat.</li>
                        <li>Datele sunt păstrate doar cât este necesar pentru gestionarea conversației.</li>
                        <li>Poți solicita accesul, rectificarea sau ștergerea datelor tale.</li>
                    </ul>
                    <p>
                        Pentru detalii complete despre modul în care Maison Outdoor protejează datele personale, poți consulta pagina dedicată.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] bg-[var(--secondary)]/35 p-5 md:p-6">
                    <Link
                        href="/politica-confidentialitate"
                        className="text-[11px] font-semibold tracking-[0.14em] uppercase underline underline-offset-4 text-[var(--foreground)]"
                    >
                        Vezi politica completă
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-6 bg-[var(--foreground)] text-white text-[11px] font-semibold tracking-[0.16em] uppercase"
                    >
                        Am înțeles
                    </button>
                </div>
            </div>
        </div>
    )
}

function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [hasPrivacyConsent, setHasPrivacyConsent] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!hasPrivacyConsent) {
            setStatus('error');
            setMessage('Te rugăm să confirmi acordul privind prelucrarea datelor personale.');
            return;
        }

        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
                setFormData({ name: '', email: '', message: '' });
                setHasPrivacyConsent(false);
            } else {
                setStatus('error');
                setMessage(data.error?.message || 'A apărut o eroare.');
            }
        } catch {
            setStatus('error');
            setMessage('A apărut o eroare de rețea.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'success' && (
                <div className="bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] px-4 py-3 rounded-none relative text-sm leading-6">
                    {message}
                </div>
            )}
            {status === 'error' && (
                <div className="bg-white border border-[var(--foreground)] text-[var(--foreground)] px-4 py-3 rounded-none relative text-sm leading-6">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label htmlFor="name" className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Nume</label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-[var(--border)] bg-white px-3 py-2.5 rounded-none focus:outline-none focus:border-[var(--foreground)] text-foreground transition-colors"
                    placeholder="Numele tău"
                    required
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Email</label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-[var(--border)] bg-white px-3 py-2.5 rounded-none focus:outline-none focus:border-[var(--foreground)] text-foreground transition-colors"
                    placeholder="Email-ul tău"
                    required
                />
            </div>
            </div>
            <div>
                <label htmlFor="message" className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Mesaj</label>
                <textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-[var(--border)] bg-white px-3 py-2.5 rounded-none focus:outline-none focus:border-[var(--foreground)] text-foreground transition-colors"
                    placeholder="Cu ce te putem ajuta?"
                    required
                ></textarea>
            </div>

            <label className="flex items-start gap-3 border border-[var(--border)] bg-[var(--secondary)]/35 p-4 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={hasPrivacyConsent}
                    onChange={(e) => setHasPrivacyConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--foreground)]"
                    required
                />
                <span className="text-sm leading-7 text-[var(--muted-foreground)]">
                    Sunt de acord ca datele trimise prin acest formular să fie prelucrate pentru a primi un răspuns la solicitarea mea, conform{' '}
                    <button
                        type="button"
                        onClick={() => setIsPrivacyModalOpen(true)}
                        className="font-semibold text-[var(--foreground)] underline underline-offset-4"
                    >
                        Politicii de Confidențialitate
                    </button>
                    .
                </span>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="h-12 bg-[var(--foreground)] text-white px-8 rounded-none hover:bg-black transition-colors disabled:opacity-50 text-[11px] font-semibold tracking-[0.18em] uppercase"
                >
                    {status === 'loading' ? 'Se trimite...' : 'Trimite Mesaj'}
                </button>
                <p className="text-xs leading-6 text-[var(--muted-foreground)]">
                    Răspundem de obicei în maximum 24h în zilele lucrătoare.
                </p>
            </div>
            {isPrivacyModalOpen ? <PrivacyPolicyModal onClose={() => setIsPrivacyModalOpen(false)} /> : null}
        </form>
    );
}

export default function ContactPage() {
    return (
        <div className="legal-page-shell">
            <h1 className="legal-page-title">Contact</h1>
            <p className="legal-page-subtitle">Suntem aici pentru tine</p>

            <div className="legal-layout">
                <LegalSidebar />

                {/* Main Content */}
                <div className="legal-main">
                    <section className="legal-content-card">
                        <div className="legal-section-heading">
                            <Phone />
                            <h2>Informații de Contact</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="legal-icon-tile">
                                        <Mail />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Email</p>
                                        <a href="mailto:support@nextcommerce.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                            support@nextcommerce.com
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">Răspundem în maxim 24h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="legal-icon-tile">
                                        <Phone />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Telefon</p>
                                        <a href="tel:+40700000000" className="text-muted-foreground hover:text-foreground transition-colors">
                                            +40 700 000 000
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">Luni - Vineri: 09:00 - 18:00</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="legal-icon-tile">
                                        <MapPin />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Sediu Central</p>
                                        <p className="text-muted-foreground">
                                            Strada Comerțului Nr. 123<br />
                                            București, România<br />
                                            Cod Poștal: 012345
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[var(--border)] pt-8">
                            <div className="mb-6 max-w-2xl">
                                <h3 className="text-sm font-semibold tracking-[0.16em] uppercase text-foreground mb-3">Formular de Contact</h3>
                                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                                    Scrie-ne câteva detalii despre solicitarea ta, iar echipa Maison Outdoor îți va răspunde cât mai curând.
                                </p>
                            </div>
                            <ContactForm />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
