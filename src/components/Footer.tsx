import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#F9F8F6] text-[#1a1a1a] border-t border-[#e5e4e0]">
      {/* Main Footer */}
      <div className="max-w-full mx-auto px-6 md:px-10 lg:px-16 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-light tracking-[0.3em] uppercase">
              MAISON
            </h3>
            <div className="space-y-4 max-w-sm">
              <p className="text-[13px] font-normal leading-relaxed text-[#4a4a4a]">
                A curation of timeless essentials and modern luxury.
                Rooted in Mayfair, London, serving a global community
                of discerning individuals.
              </p>
              <div className="pt-2">
                <p className="text-[11px] tracking-[0.15em] uppercase text-[#8a8a8a]">
                  27 Savile Row, Mayfair, London
                </p>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">Customer Service</h4>
            <div className="space-y-4">
              {[
                { href: '/contact', label: 'Contact Us' },
                { href: '/livrare-gratuita', label: 'Shipping & Delivery' },
                { href: '/politica-retur', label: 'Returns & Exchanges' },
                { href: '/intrebari-frecvente', label: 'Account' },
                { href: '/ghid-marimi', label: 'Size Guide' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="block text-[13px] font-normal text-[#4a4a4a] hover:text-[#000] transition-colors duration-300">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">Company</h4>
            <div className="space-y-4">
              {[
                { href: '/despre-noi', label: 'About MAISON' },
                { href: '/collections', label: 'Collections' },
                { href: '/brand-promise', label: 'The Promise' },
                { href: '/careers', label: 'Careers' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="block text-[13px] font-normal text-[#4a4a4a] hover:text-[#000] transition-colors duration-300">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1a1a]">Connect</h4>
            <div className="space-y-4">
              {[
                { href: '#', label: 'Instagram' },
                { href: '#', label: 'Facebook' },
                { href: '#', label: 'Pinterest' },
                { href: '#', label: 'LinkedIn' },
              ].map(({ href, label }) => (
                <Link key={label} href={href}
                  className="block text-[13px] font-normal text-[#4a4a4a] hover:text-[#000] transition-colors duration-300">
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] tracking-[0.15em] uppercase text-[#8a8a8a]">
              <span>© 2024 MAISON</span>
              <Link href="/politica-confidentialitate" className="hover:text-[#1a1a1a] transition-colors">Privacy Policy</Link>
              <Link href="/termeni-si-conditii" className="hover:text-[#1a1a1a] transition-colors">Terms of Service</Link>
              <Link href="/politica-cookie" className="hover:text-[#1a1a1a] transition-colors">Cookies</Link>
            </div>
            <div className="text-[10px] tracking-[0.15em] uppercase text-[#8a8a8a]">
              United Kingdom / English
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
