import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ui/ProductCard'
import QuickDevisForm from '@/components/site/QuickDevisForm'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Teralite — La lumière qui pense pour vous',
  description:
    "Teralite : solutions d'éclairage LED intelligent avec détection automatique à Dakar, Sénégal. Économisez jusqu'à 70% sur votre facture d'électricité.",
  openGraph: {
    title: 'Teralite — La lumière qui pense pour vous',
    description: "Solutions d'éclairage LED intelligent à Dakar, Sénégal.",
    type: 'website',
  },
}

async function getProduitsVedettes() {
  try {
    return await prisma.produit.findMany({
      where: { estVedette: true, archive: false },
      include: { photos: { where: { estPrincipale: true }, take: 1 } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

async function getTemoignages() {
  try {
    return await prisma.temoignage.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' },
      take: 3,
    })
  } catch {
    return []
  }
}

const HERO_DEFAULTS = {
  hero_titre: 'La lumière qui pense pour vous',
  hero_sous_titre:
    "Réduisez votre facture d'électricité jusqu'à 70% grâce à nos solutions LED intelligentes avec détection automatique. Simple. Efficace. Accessible.",
  hero_cta: 'Voir le catalogue',
}

async function getHeroContenu() {
  try {
    const items = await prisma.contenuSite.findMany({
      where: { cle: { in: ['hero_titre', 'hero_sous_titre', 'hero_cta', 'banniere_active', 'banniere_texte', 'banniere_couleur'] } },
    })
    const fromDb = Object.fromEntries(items.map((i) => [i.cle, i.valeur]))
    return { ...HERO_DEFAULTS, ...fromDb }
  } catch {
    return HERO_DEFAULTS
  }
}

export default async function HomePage() {
  const [produits, temoignages, hero] = await Promise.all([
    getProduitsVedettes(),
    getTemoignages(),
    getHeroContenu(),
  ])

  return (
    <>
      {/* ── BANNIÈRE PROMOTIONNELLE ── */}
      {hero.banniere_active === 'true' && hero.banniere_texte && (
        <div
          className="text-white text-center text-sm font-medium py-2.5 px-4"
          style={{ backgroundColor: hero.banniere_couleur ?? '#FFA000' }}
        >
          {hero.banniere_texte}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative text-white py-16 md:py-24 px-4 overflow-hidden">
        {/* Image de fond */}
        <Image
          src="https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=1920&q=80"
          alt="Éclairage LED professionnel"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Overlay bleu-foncé 70% */}
        <div className="absolute inset-0 bg-[#002D50]/70" />
        {/* Contenu */}
        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-orange-teralite text-xs font-semibold uppercase tracking-widest mb-4">
            Éclairage LED Intelligent · Dakar, Sénégal
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-6">
            {hero.hero_titre}
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {hero.hero_sous_titre}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/produits"
              className="bg-orange-teralite hover:bg-orange-dark text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              {hero.hero_cta}
            </Link>
            <Link
              href="/devis"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-lg transition-colors border border-white/20"
            >
              Devis gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-blue-dark text-white py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { valeur: '-70%', label: 'Sur votre facture électrique' },
            { valeur: '30 000h', label: 'Durée de vie selon modèle' },
            { valeur: 'IP65', label: 'Résistance aux intempéries' },
            { valeur: '3+', label: 'Moyens de paiement acceptés' },
          ].map((stat) => (
            <div key={stat.valeur}>
              <p className="text-2xl md:text-3xl font-semibold text-orange-teralite">
                {stat.valeur}
              </p>
              <p className="text-xs text-white/60 mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUITS VEDETTES ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-1">
              Sélection
            </p>
            <h2 className="text-2xl font-semibold text-blue-teralite">
              Nos produits vedettes
            </h2>
          </div>
          <Link
            href="/produits"
            className="text-sm text-blue-teralite hover:underline font-medium"
          >
            Voir tout le catalogue →
          </Link>
        </div>

        {produits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {produits.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                nom={p.nom}
                categorie={p.categorie}
                descriptionCourte={p.descriptionCourte}
                prixPublic={p.prixPublic}
                statut={p.statut}
                estVedette={p.estVedette}
                photoUrl={p.photos[0]?.url ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="bg-blue-light rounded-xl p-8 text-center">
            <p className="text-text-mid text-sm">
              Les produits seront disponibles très prochainement.
            </p>
            <Link
              href="/devis"
              className="inline-block mt-4 bg-blue-teralite text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-dark transition-colors"
            >
              Faire une demande de devis
            </Link>
          </div>
        )}
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="bg-gray-fond py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
              Simple et rapide
            </p>
            <h2 className="text-2xl font-semibold text-blue-teralite">
              Comment ça marche
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                titre: 'Choisissez vos produits',
                desc: 'Parcourez notre catalogue d\'éclairage LED intelligent. Filtrez par catégorie ou faites une demande de devis pour un projet sur mesure.',
              },
              {
                num: '02',
                titre: 'Passez commande',
                desc: 'Payez en toute sécurité via Orange Money, Wave ou à la livraison. Votre commande est confirmée instantanément.',
              },
              {
                num: '03',
                titre: 'La lumière s\'adapte à vous',
                desc: 'Nos LED intelligentes s\'allument à votre passage et s\'éteignent seules après 60 secondes à 2 minutes selon le modèle — aucune action requise.',
              },
            ].map((etape) => (
              <div key={etape.num} className="bg-white rounded-xl p-6 border border-border-main">
                <div className="w-10 h-10 bg-blue-teralite rounded-xl flex items-center justify-center mb-4">
                  <span className="text-xs font-bold text-white">{etape.num}</span>
                </div>
                <h3 className="font-semibold text-text-main mb-2">{etape.titre}</h3>
                <p className="text-text-mid text-sm leading-relaxed">{etape.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      {temoignages.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
              Ils nous font confiance
            </p>
            <h2 className="text-2xl font-semibold text-blue-teralite">
              Témoignages clients
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {temoignages.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-border-main p-6">
                <div className="flex mb-3">
                  {Array.from({ length: t.note }).map((_, i) => (
                    <span key={i} className="text-orange-teralite text-sm">★</span>
                  ))}
                </div>
                <p className="text-text-mid text-sm leading-relaxed mb-4 italic">
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-text-main">{t.nom}</p>
                  <p className="text-xs text-text-light">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DEVIS RAPIDE ── */}
      <section className="bg-blue-light py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
              Gratuit &amp; sans engagement
            </p>
            <h2 className="text-2xl font-semibold text-blue-teralite mb-2">
              Demandez votre devis en 2 minutes
            </h2>
            <p className="text-text-mid text-sm">
              Notre équipe vous répond sous 24h avec une offre personnalisée.
            </p>
          </div>
          <QuickDevisForm />
        </div>
      </section>

      {/* ── PAIEMENTS ── */}
      <section className="border-t border-border-main py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-text-light uppercase tracking-wider mb-6">
            Moyens de paiement acceptés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { label: 'Orange Money', color: 'bg-[#FF6600]' },
              { label: 'Wave', color: 'bg-[#1DC9DA]' },
              { label: 'Espèces', color: 'bg-gray-fond border border-border-main' },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">
                    {p.label[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-text-mid">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
