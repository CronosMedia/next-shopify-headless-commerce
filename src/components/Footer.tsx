import Link from 'next/link'
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  Shield,
  Clock,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="font-bold text-xl">next-commerce</span>
            </div>
            <p className="text-gray-300 text-sm">
              Sursa ta de încredere pentru produse premium de sănătate și wellness.
              Calitate garantată, livrare rapidă.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Link-uri Rapide</h3>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Acasă
              </Link>
              <Link
                href="/collections"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Categorii
              </Link>
              <Link
                href="/oferte"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Oferte
              </Link>
              <Link
                href="/noutati"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Noutăți
              </Link>
              <Link
                href="/despre-noi"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Despre Noi
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Serviciu Clienți</h3>
            <div className="space-y-2">
              <Link
                href="/contact"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/livrare-gratuita"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Informații Livrare
              </Link>
              <Link
                href="/politica-retur"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Politica de Retur
              </Link>
              <Link
                href="/intrebari-frecvente"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Întrebări Frecvente
              </Link>
              <Link
                href="/ghid-marimi"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Ghid Mărimi
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">
                  support@nextcommerce.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">+40 700 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">
                  Strada Comerțului Nr. 123, București
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Truck size={16} className="text-green-400" />
              <span>Livrare Gratuită</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Shield size={16} className="text-green-400" />
              <span>Plată Securizată</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock size={16} className="text-green-400" />
              <span>Suport 24/7</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CreditCard size={16} className="text-green-400" />
              <span>Retur Simplu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © 2024 Next Commerce. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link
                href="/politica-confidentialitate"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Politica de Confidențialitate
              </Link>
              <Link
                href="/termeni-si-conditii"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Termeni și Condiții
              </Link>
              <Link
                href="/politica-cookie"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Politica Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}



