'use client'
import { useState } from 'react'
import { Phone, Mail, MapPin } from 'lucide-react'
import { LegalSidebar } from '@/components/LegalSidebar'

function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

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
            } else {
                setStatus('error');
                setMessage(data.error?.message || 'A apărut o eroare.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('A apărut o eroare de rețea.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {status === 'success' && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-none relative">
                    {message}
                </div>
            )}
            {status === 'error' && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-none relative">
                    {message}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Nume</label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-none focus:outline-none focus:border-primary text-foreground"
                    placeholder="Numele tău"
                    required
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-none focus:outline-none focus:border-primary text-foreground"
                    placeholder="Email-ul tău"
                    required
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Mesaj</label>
                <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-none focus:outline-none focus:border-primary text-foreground"
                    placeholder="Cu ce te putem ajuta?"
                    required
                ></textarea>
            </div>
            <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-primary text-white px-6 py-2 rounded-none hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
                {status === 'loading' ? 'Se trimite...' : 'Trimite Mesaj'}
            </button>
        </form>
    );
}

export default function ContactPage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Contact</h1>
            <p className="text-lg text-muted-foreground mb-8">Suntem aici pentru tine</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <LegalSidebar />

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <section className="bg-card p-8 border border-gray-300 rounded-none space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Phone className="w-8 h-8 text-primary" />
                            <h2 className="text-2xl font-bold text-foreground">Informații de Contact</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Email</p>
                                        <a href="mailto:support@nextcommerce.com" className="text-muted-foreground hover:text-primary transition-colors">
                                            support@nextcommerce.com
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">Răspundem în maxim 24h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Telefon</p>
                                        <a href="tel:+40700000000" className="text-muted-foreground hover:text-primary transition-colors">
                                            +40 700 000 000
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">Luni - Vineri: 09:00 - 18:00</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                        <MapPin className="w-6 h-6" />
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

                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="text-xl font-semibold text-foreground mb-4">Formular de Contact</h3>
                            <ContactForm />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
