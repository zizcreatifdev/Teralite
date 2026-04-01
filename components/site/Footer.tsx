import Link from 'next/link'

export default function Footer() {
  const annee = new Date().getFullYear()

  return (
    <footer className="bg-blue-dark text-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Colonne 1 — Identité */}
          <div>
            <span className="text-white font-bold text-xl tracking-tight">Teralite</span>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              La lumière qui pense pour vous.
              Solutions d&apos;éclairage LED professionnel à Dakar, Sénégal.
            </p>
          </div>

          {/* Colonne 2 — Liens */}
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
                  href="https://wa.me/221XXXXXXXX"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp : +221 XX XXX XX XX
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@teralite.sn"
                  className="hover:text-white transition-colors"
                >
                  contact@teralite.sn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre de bas */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {annee} Teralite. Tous droits réservés.
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
