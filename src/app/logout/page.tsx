import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const discoveryLinks = [
  {
    href: '/noutati',
    label: 'Vezi noutățile',
    description: 'Cele mai recente piese intrate în selecția Maison Outdoor.',
  },
  {
    href: '/collections',
    label: 'Explorează colecțiile',
    description: 'Echipament premium pentru trasee, oraș și weekenduri lungi.',
  },
  {
    href: '/oferte',
    label: 'Descoperă ofertele',
    description: 'Ocazii bune de prins înainte să dispară din stoc.',
  },
]

export default function LogoutPage() {
  return (
    <main className="bg-white">
      <section className="grid min-h-[calc(100svh-72px)] grid-cols-1 lg:h-[calc(100svh-72px)] lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
        <div className="relative h-[42svh] min-h-[340px] overflow-hidden lg:h-full lg:min-h-0">
          <Image
            src="/images/hero/campaign-outdoor.jpg"
            alt="Maison Outdoor"
            fill
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="flex items-center px-6 py-14 md:px-12 lg:h-full lg:overflow-y-auto lg:px-16">
          <div className="w-full max-w-xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
              Sesiune încheiată
            </p>
            <h1 className="text-3xl font-light uppercase leading-tight tracking-[0.12em] text-neutral-950 md:text-4xl">
              Ai fost deconectat
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-500 md:text-base">
              Coșul tău rămâne aproape. Până revii în cont, am lăsat câteva trasee scurte
              către piesele care merită încă o privire.
            </p>

            <div className="mt-10 space-y-3">
              {discoveryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between gap-5 border border-neutral-200 px-5 py-4 transition-colors hover:border-black hover:bg-[#F9F8F6]"
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-500">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    strokeWidth={1.5}
                    className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-black"
                  />
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
              >
                Continuă să explorezi
              </Link>
              <Link
                href="/account"
                className="inline-flex h-12 items-center justify-center border border-neutral-300 bg-white px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-950 transition-colors hover:border-black hover:bg-[#F9F8F6]"
              >
                Intră din nou în cont
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
