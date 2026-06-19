'use client'

import { useState } from 'react'

export default function NewsletterSection() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (email) {
            setSubmitted(true)
            setEmail('')
        }
    }

    return (
        <section className="bg-white py-24 md:py-32 border-t border-[#e5e4e0]">
            <div className="max-w-3xl mx-auto text-center px-6">
                <h2 className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase text-[#1a1a1a] mb-8">
                    Clubul Trail
                </h2>
                <p className="text-base md:text-lg font-medium leading-relaxed text-[#4a4a4a] mb-12 max-w-md mx-auto">
                    Înscrie-te pentru a primi noutăți despre echipamente noi, ghiduri de traseu și expediții exclusive în comunitate.
                </p>

                {submitted ? (
                    <div className="py-4">
                        <p className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">
                            Succes — Bun venit în Clubul Trail
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-lg mx-auto" suppressHydrationWarning>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Adresă de e-mail"
                            required
                            className="w-full md:flex-1 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] text-base md:text-lg font-medium tracking-wide py-3 px-0 placeholder:text-[#8a8a8a] focus:outline-none focus:border-[#4a4a4a] transition-all"
                        />
                        <button
                            type="submit"
                            className="w-full md:w-auto h-14 px-8 flex items-center justify-center text-[12px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 bg-[#1a1a1a] text-white hover:bg-[#333333] cursor-pointer"
                        >
                            Abonează-te
                        </button>
                    </form>
                )}
            </div>
        </section>
    )
}
