import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ui/ProductCard'
import CatalogueFilters from '@/components/site/CatalogueFilters'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Catalogue — Éclairage LED | Teralite',
  description:
    "Découvrez toute la gamme d'éclairage LED Teralite : ampoules, plafonniers, lampadaires solaires, éclairage industriel. Livraison à Dakar et au Sénégal.",
  openGraph: {
    title: 'Catalogue Teralite — Éclairage LED Professionnel',
    description: "Gamme complète d'éclairage LED pour particuliers et professionnels.",
    type: 'website',
  },
}

async function getProduits() {
  try {
    return await prisma.produit.findMany({
      where: { archive: false },
      include: { photos: { where: { estPrincipale: true }, take: 1 } },
      orderBy: [{ estVedette: 'desc' }, { createdAt: 'desc' }],
    })
  } catch {
    return []
  }
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { categorie?: string }
}) {
  const produits = await getProduits()
  const categories = Array.from(new Set(produits.map((p) => p.categorie))).sort()
  const categorieActive = searchParams.categorie ?? 'Tous'

  const produitsFiltres =
    categorieActive === 'Tous'
      ? produits
      : produits.filter((p) => p.categorie === categorieActive)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* En-tête */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-1">
          Catalogue complet
        </p>
        <h1 className="text-2xl font-semibold text-blue-teralite mb-2">
          Nos produits d&apos;éclairage LED
        </h1>
        <p className="text-text-mid text-sm">
          {produits.length} produit{produits.length > 1 ? 's' : ''} disponible{produits.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <CatalogueFilters categories={categories} active={categorieActive} />

      {/* Grille */}
      {produitsFiltres.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {produitsFiltres.map((p) => (
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
        <div className="mt-8 bg-gray-fond rounded-xl p-12 text-center">
          <p className="text-text-mid text-sm mb-4">
            Aucun produit dans cette catégorie pour le moment.
          </p>
          <a
            href="/produits"
            className="text-sm text-blue-teralite hover:underline"
          >
            ← Voir tous les produits
          </a>
        </div>
      )}
    </div>
  )
}
