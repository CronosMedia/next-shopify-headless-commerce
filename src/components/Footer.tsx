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
              Your trusted source for premium health and wellness products.
              Quality guaranteed, delivered fast.
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
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/collections"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/deals"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Deals
              </Link>
              <Link
                href="/new"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                New Arrivals
              </Link>
              <Link
                href="/about"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                About Us
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Customer Service</h3>
            <div className="space-y-2">
              <Link
                href="/contact"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/shipping"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Shipping Info
              </Link>
              <Link
                href="/returns"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Returns & Exchanges
              </Link>
              <Link
                href="/faq"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/size-guide"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Size Guide
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">
                  support@nextcommerce.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">
                  123 Commerce St, City, State 12345
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
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Shield size={16} className="text-green-400" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock size={16} className="text-green-400" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CreditCard size={16} className="text-green-400" />
              <span>Easy Returns</span>
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
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}



