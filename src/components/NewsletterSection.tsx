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
                    The Inner Circle
                </h2>
                <p className="text-[13px] font-normal leading-relaxed text-[#4a4a4a] mb-12 max-w-sm mx-auto">
                    Be the first to discover new arrivals, exclusive events
                    and the latest from the world of MAISON.
                </p>

                {submitted ? (
                    <div className="py-4">
                        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">
                            Success — Welcome to Maison
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-lg mx-auto" suppressHydrationWarning>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="w-full md:flex-1 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] text-[13px] font-normal tracking-wide py-3 px-0 placeholder:text-[#8a8a8a] focus:outline-none focus:border-[#4a4a4a] transition-all"
                        />
                        <button
                            type="submit"
                            className="w-full md:w-auto text-[11px] font-semibold tracking-[0.3em] uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 hover:text-[#8a8a8a] hover:border-[#8a8a8a] transition-all duration-300"
                        >
                            Subscribe
                        </button>
                    </form>
                )}
            </div>
        </section>
    )
}
