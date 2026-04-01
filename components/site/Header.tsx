'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/produits', label: 'Produits' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <header className="bg-white border-b border-border-main sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-teralite font-bold text-xl tracking-tight">Teralite</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-blue-teralite font-medium'
                  : 'text-text-mid hover:text-blue-teralite'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/panier"
            className="relative w-9 h-9 flex items-center justify-center text-text-mid hover:text-blue-teralite transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link
            href="/devis"
            className="hidden md:flex bg-orange-teralite text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-dark transition-colors"
          >
            Demande de devis
          </Link>

          {/* Bouton menu mobile */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-text-mid"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label="Menu"
          >
            {menuOuvert ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="md:hidden border-t border-border-main bg-white">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOuvert(false)}
                className={`text-sm py-2 px-3 rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-light text-blue-teralite font-medium'
                    : 'text-text-mid hover:bg-gray-fond'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/devis"
              onClick={() => setMenuOuvert(false)}
              className="bg-orange-teralite text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-orange-dark transition-colors text-center mt-2"
            >
              Demande de devis
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
