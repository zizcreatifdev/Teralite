import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const annee = new Date().getFullYear()

  return (
    <footer className="bg-blue-dark text-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Colonne 1 — Identité */}
          <div className="md:col-span-1">
            <Image
              src="/logos/TeraLite_Logo-blanc.png"
              alt="TeraLite"
              width={120}
              height={38}
              className="h-9 w-auto object-contain mb-3"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              La lumière qui pense pour vous.<br />
              LED intelligent · Dakar, Sénégal.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Orange Money', 'Wave', 'Espèces'].map((m) => (
                <span key={m} className="text-[11px] bg-white/10 text-white/70 rounded-full px-2.5 py-0.5">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/produits', label: 'Catalogue produits' },
                { href: '/devis', label: 'Demande de devis' },
                { href: '/a-propos', label: 'À propos de Teralite' },
                { href: '/faq', label: 'Foire aux questions' },
                { href: '/contact', label: 'Nous contacter' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Contact */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Dakar, Sénégal</li>
              <li>
                <a
                  href="mailto:contact@teralitegroup.com"
                  className="hover:text-white transition-colors"
                >
                  contact@teralitegroup.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.TeraLiteGroup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  www.TeraLiteGroup.com
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne 4 — Livraison */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Livraison
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>🚚 Livraison rapide Dakar</li>
              <li>📦 Toutes les régions du Sénégal</li>
              <li>✅ Suivi de commande en ligne</li>
            </ul>
          </div>
        </div>

        {/* Barre de bas */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {annee} TeraLite Group. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/cgv" className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Conditions générales de vente
            </Link>
            <Link href="/suivi" className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Suivi de commande
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
