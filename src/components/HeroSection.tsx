'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HeroSection() {
    const [scrollY, setScrollY] = useState(0)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setLoaded(true)
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Background Image with Parallax */}
            <div
                className="absolute inset-0 w-full h-[120%]"
                style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            >
                <Image
                    src="/images/hero/hero-hires-v5.jpg"
                    alt="Maison Outdoor – Hiker standing on a dramatic mountain ridge at sunrise"
                    fill
                    priority
                    className={`object-cover transition-all duration-[2000ms] ease-out ${loaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
                    style={{ objectPosition: 'center 30%' }}
                    sizes="100vw"
                    quality={100}
                />
            </div>

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

            {/* Content - Pure Luxury Centered Alignment */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
                <div className={`transition-all duration-[2000ms] ease-out delay-300 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-white/80 mb-6 block [text-shadow:_0_1px_4px_rgba(0,0,0,0.3)]">
                        Maison Outdoor
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.15em] uppercase text-white leading-[1.2] mb-12 max-w-4xl [text-shadow:_0_2px_10px_rgba(0,0,0,0.3)]">
                        WILD BY NATURE
                        <br />
                        <span className="font-semibold tracking-[0.1em] text-lg md:text-2xl block mt-4 normal-case [text-shadow:_0_1px_5px_rgba(0,0,0,0.3)]">echipat pentru libertate</span>
                    </h1>
                    <div className="pt-4">
                        <Link
                            href="/collections"
                            className="inline-flex items-center justify-center h-14 px-8 text-[12px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 bg-white text-[#1a1a1a] hover:bg-[#e5e4e0] hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg"
                        >
                            Explorează Produsele
                        </Link>
                    </div>
                </div>
            </div>

            {/* Refined Scroll Indicator */}
            <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-10 transition-all duration-[2000ms] delay-[2500ms] ${loaded ? 'opacity-50' : 'opacity-0'}`}>
                <div className="h-12 w-[1px] bg-gradient-to-b from-white to-transparent" />
            </div>
        </section>
    )
}
