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
                    src="/images/hero/hero-hires-v4.jpg"
                    alt="Luxury fashion – The Spring Collection"
                    fill
                    priority
                    className={`object-cover transition-all duration-[2000ms] ease-out ${loaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
                    style={{ objectPosition: 'center 30%' }}
                    sizes="100vw"
                    quality={100}
                />
            </div>

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

            {/* Content - Pure Luxury Centered Alignment */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
                <div className={`transition-all duration-[2000ms] ease-out delay-300 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-white/80 mb-6 block">
                        Maison Edition
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.15em] uppercase text-white leading-[1.2] mb-12 max-w-4xl">
                        The art of
                        <br />
                        <span className="font-light">refined living</span>
                    </h1>
                    <div className="pt-4">
                        <Link
                            href="/collections"
                            className="group relative inline-flex flex-col items-center"
                        >
                            <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-white mb-2">
                                Discover
                            </span>
                            <div className="h-[1px] w-8 bg-white/40 group-hover:w-full transition-all duration-700 ease-in-out" />
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
