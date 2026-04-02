import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatFCFA } from '@/lib/utils'
import { BadgeProduit } from '@/components/ui/Badge'
import ProductCard from '@/components/ui/ProductCard'
import GaleriePhotos from '@/components/site/GaleriePhotos'
import AjoutPanierSection from '@/components/site/AjoutPanierSection'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  try {
    const produit = await prisma.produit.findUnique({ where: { slug: params.slug } })
    if (!produit) return { title: 'Produit introuvable | Teralite' }
    return {
      title: `${produit.nom} | Teralite`,
      description: produit.descriptionCourte,
      openGraph: {
        title: produit.nom,
        description: produit.descriptionCourte,
        type: 'website',
      },
    }
  } catch {
    return { title: 'Produit | Teralite' }
  }
}

export async function generateStaticParams() {
  try {
    const produits = await prisma.produit.findMany({
      where: { archive: false },
      select: { slug: true },
    })
    return produits.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export default async function FicheProduitPage({
  params,
}: {
  params: { slug: string }
}) {
  let produit
  try {
    produit = await prisma.produit.findUnique({
      where: { slug: params.slug, archive: false },
      include: { photos: { orderBy: [{ estPrincipale: 'desc' }, { ordre: 'asc' }] } },
    })
  } catch {
    notFound()
  }

  if (!produit) notFound()

  // Produits similaires
  type ProduitAvecPhotos = Awaited<ReturnType<typeof prisma.produit.findMany<{ include: { photos: true } }>>>[number]
  let similaires: ProduitAvecPhotos[] = []
  try {
    similaires = await prisma.produit.findMany({
      where: {
        categorie: produit.categorie,
        archive: false,
        id: { not: produit.id },
      },
      include: { photos: { where: { estPrincipale: true }, take: 1 } },
      take: 3,
    })
  } catch {
    similaires = []
  }

  const specifications = produit.specifications as Array<{ label: string; valeur: string }> | null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-light mb-8">
        <Link href="/" className="hover:text-blue-teralite transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/produits" className="hover:text-blue-teralite transition-colors">Produits</Link>
        <span>/</span>
        <Link href={`/produits?categorie=${encodeURIComponent(produit.categorie)}`} className="hover:text-blue-teralite transition-colors">
          {produit.categorie}
        </Link>
        <span>/</span>
        <span className="text-text-mid">{produit.nom}</span>
      </nav>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
        {/* Galerie */}
        <GaleriePhotos photos={produit.photos} nom={produit.nom} />

        {/* Infos produit */}
        <div>
          <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
            {produit.categorie}
          </p>
          <h1 className="text-2xl font-semibold text-text-main mb-3 leading-tight">
            {produit.nom}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <BadgeProduit statut={produit.statut} />
            <span className="font-mono text-xs text-text-light">{produit.reference}</span>
          </div>

          <p className="text-text-mid text-sm leading-relaxed mb-6">
            {produit.descriptionCourte}
          </p>

          {/* Prix */}
          <div className="bg-blue-light rounded-xl px-5 py-4 mb-6">
            {produit.prixPublic ? (
              <>
                <p className="text-xs text-text-light mb-1">Prix public</p>
                <p className="text-3xl font-semibold text-blue-teralite">
                  {formatFCFA(produit.prixPublic)}
                </p>
                {produit.tva > 0 && (
                  <p className="text-xs text-text-light mt-1">
                    TTC (TVA {(produit.tva * 100).toFixed(0)}% incluse)
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-text-light mb-1">Tarification</p>
                <p className="text-lg font-semibold text-blue-teralite">Prix sur devis</p>
                <p className="text-xs text-text-mid mt-1">
                  Ce produit nécessite une demande de devis personnalisée.
                </p>
              </>
            )}
          </div>

          {/* Panier / Devis */}
          <AjoutPanierSection
            produitId={produit.id}
            nom={produit.nom}
            prixPublic={produit.prixPublic}
            statut={produit.statut}
          />
        </div>
      </div>

      {/* Description longue */}
      {produit.descriptionLongue && (
        <div className="bg-white rounded-xl border border-border-main p-8 mb-8">
          <h2 className="text-lg font-semibold text-text-main mb-4">Description détaillée</h2>
          <div className="text-text-mid text-sm leading-relaxed whitespace-pre-line">
            {produit.descriptionLongue}
          </div>
        </div>
      )}

      {/* Spécifications */}
      {specifications && specifications.length > 0 && (
        <div className="bg-white rounded-xl border border-border-main overflow-hidden mb-8">
          <div className="px-8 py-5 border-b border-border-main">
            <h2 className="text-lg font-semibold text-text-main">Spécifications techniques</h2>
          </div>
          <div className="divide-y divide-border-main">
            {specifications.map((spec, i) => (
              <div key={i} className="flex items-start px-8 py-3">
                <span className="text-xs font-semibold text-text-light uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">
                  {spec.label}
                </span>
                <span className="text-sm text-text-main">{spec.valeur}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produits similaires */}
      {similaires.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-blue-teralite mb-6">
            Produits similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {similaires.map((p) => (
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
        </div>
      )}
    </div>
  )
}
