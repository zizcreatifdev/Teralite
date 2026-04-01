import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Teralite — La lumière qui pense pour vous',
  description:
    'Découvrez notre gamme complète de solutions d\'éclairage LED professionnel à Dakar. Ampoules, luminaires, éclairage solaire et industriel.',
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-blue-teralite text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6">
            La lumière qui pense pour vous
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Solutions d&apos;éclairage LED professionnel au Sénégal.
            Qualité supérieure, économies d&apos;énergie garanties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/produits"
              className="bg-orange-teralite hover:bg-orange-dark text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              Voir le catalogue
            </Link>
            <Link
              href="/devis"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-lg transition-colors border border-white/20"
            >
              Demande de devis
            </Link>
          </div>
        </div>
      </section>

      {/* Section produits vedettes — placeholder */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-blue-teralite mb-2">
          Nos produits vedettes
        </h2>
        <p className="text-text-mid text-sm mb-8">
          Découvrez notre sélection de produits les plus populaires
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-border-main overflow-hidden shadow-sm"
            >
              <div className="bg-gray-fond h-48 flex items-center justify-center">
                <span className="text-text-light text-sm">Image produit</span>
              </div>
              <div className="p-5">
                <p className="text-xs text-text-light uppercase tracking-wider mb-1">
                  Catégorie
                </p>
                <h3 className="font-semibold text-text-main mb-2">Produit à venir</h3>
                <p className="text-text-mid text-sm mb-4">
                  Description courte du produit — disponible en Phase 2
                </p>
                <button
                  disabled
                  className="w-full border border-border-main text-text-mid text-sm py-2 rounded-lg opacity-60"
                >
                  Voir le produit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Devis */}
      <section className="bg-orange-light border-t border-orange-teralite/20 py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-text-main mb-3">
            Un projet d&apos;éclairage ? Obtenez votre devis gratuit
          </h2>
          <p className="text-text-mid text-sm mb-6">
            Notre équipe vous répond sous 24h avec une offre personnalisée
          </p>
          <Link
            href="/devis"
            className="bg-orange-teralite hover:bg-orange-dark text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Demander un devis gratuit
          </Link>
        </div>
      </section>
    </>
  )
}
