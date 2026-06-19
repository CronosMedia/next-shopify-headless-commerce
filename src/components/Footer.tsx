import Link from 'next/link'
import { Truck, Lock, RefreshCw } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#F9F8F6] text-[#1a1a1a] border-t border-[#e5e4e0]">
      {/* Trust/Assurance Row */}
      <div className="border-b border-[#e5e4e0] pt-6 pb-10 md:py-16 bg-white">
        <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 text-center">
            <Link
              href="/livrare-gratuita"
              className="flex flex-col items-center group transition-opacity duration-300 hover:opacity-80"
            >
              <Truck size={28} strokeWidth={1} className="text-[#1a1a1a] mb-5" />
              <h5 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1a1a1a] mb-3">
                Livrare Gratuită
              </h5>
              <p className="text-[13px] md:text-sm text-[#5a5a5a] max-w-xs font-normal leading-relaxed">
                Livrare gratuită în toată țara pentru orice comandă de peste 500 lei.
              </p>
            </Link>
            
            <Link
              href="/help-center#payments"
              className="flex flex-col items-center group transition-opacity duration-300 hover:opacity-80"
            >
              <Lock size={28} strokeWidth={1} className="text-[#1a1a1a] mb-5" />
              <h5 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1a1a1a] mb-3">
                Plată Securizată
              </h5>
              <p className="text-[13px] md:text-sm text-[#5a5a5a] max-w-xs font-normal leading-relaxed">
                Tranzacții 100% securizate cu criptare SSL de ultimă generație.
              </p>
            </Link>

            <Link
              href="/politica-retur"
              className="flex flex-col items-center group transition-opacity duration-300 hover:opacity-80"
            >
              <RefreshCw size={28} strokeWidth={1} className="text-[#1a1a1a] mb-5" />
              <h5 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1a1a1a] mb-3">
                Retur Simplu
              </h5>
              <p className="text-[13px] md:text-sm text-[#5a5a5a] max-w-xs font-normal leading-relaxed">
                Ai la dispoziție 14 zile pentru a returna produsele fără bătăi de cap.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-light tracking-[0.3em] uppercase">
              MAISON OUTDOOR
            </h3>
            <div className="space-y-4 max-w-sm">
              <p className="text-sm md:text-base font-normal leading-relaxed text-[#5a5a5a]">
                O selecție de echipamente tehnice premium și produse esențiale pentru activități în aer liber. 
                Înradăcinată în spiritul explorării și al aventurii, deservind o comunitate globală activă 
                de pasionați de outdoor.
              </p>
              <div className="pt-2">
                <p className="text-xs md:text-sm tracking-[0.15em] uppercase text-[#5a5a5a]">
                  Brașov, România
                </p>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-8">
            <h4 className="text-xs md:text-sm font-semibold tracking-[0.15em] uppercase text-[#1a1a1a]">Asistență Clienți</h4>
            <div className="space-y-4">
              {[
                { href: '/contact', label: 'Contact' },
                { href: '/livrare-gratuita', label: 'Livrare & Transport' },
                { href: '/politica-retur', label: 'Retururi & Schimburi' },
                { href: '/account', label: 'Contul Meu' },
                { href: '/ghid-marimi', label: 'Ghid Mărimi' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="block text-xs md:text-sm font-normal text-[#5a5a5a] hover:text-[#000] transition-colors duration-300">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-8">
            <h4 className="text-xs md:text-sm font-semibold tracking-[0.15em] uppercase text-[#1a1a1a]">Companie</h4>
            <div className="space-y-4">
              {[
                { href: '/despre-noi', label: 'Despre Maison Outdoor' },
                { href: '/collections', label: 'Categorii' },
                { href: '/despre-noi#promisiune', label: 'Promisiunea Noastră' },
                { href: '/despre-noi#cariere', label: 'Cariere' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="block text-xs md:text-sm font-normal text-[#5a5a5a] hover:text-[#000] transition-colors duration-300">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-8">
            <h4 className="text-xs md:text-sm font-semibold tracking-[0.15em] uppercase text-[#1a1a1a]">Urmărește-ne</h4>
            <div className="space-y-4">
              {[
                { href: '#', label: 'Instagram' },
                { href: '#', label: 'Facebook' },
                { href: '#', label: 'Pinterest' },
                { href: '#', label: 'LinkedIn' },
              ].map(({ href, label }) => (
                <Link key={label} href={href}
                  className="block text-xs md:text-sm font-normal text-[#5a5a5a] hover:text-[#000] transition-colors duration-300">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-[#e5e4e0]">
        <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <span className="order-2 md:order-1 text-[11px] tracking-[0.2em] uppercase text-[#8a8a8a]" suppressHydrationWarning>
              © {new Date().getFullYear()} MAISON OUTDOOR
            </span>
            <div className="order-1 md:order-2 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 text-[12px] text-[#5a5a5a]">
              <Link href="/politica-confidentialitate" className="hover:text-[#1a1a1a] transition-colors">Politica de Confidențialitate</Link>
              <Link href="/termeni-si-conditii" className="hover:text-[#1a1a1a] transition-colors">Termeni și Condiții</Link>
              <Link href="/politica-cookie" className="hover:text-[#1a1a1a] transition-colors">Politica Cookie</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
