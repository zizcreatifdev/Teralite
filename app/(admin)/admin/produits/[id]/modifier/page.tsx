import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ProduitForm from '@/components/admin/ProduitForm'
import type { Spec } from '@/types/index'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Modifier produit — Admin Teralite' }

export default async function ModifierProduitPage({ params }: { params: { id: string } }) {
  const produit = await prisma.produit
    .findUnique({
      where: { id: params.id },
      include: { photos: { orderBy: { ordre: 'asc' } } },
    })
    .catch(() => null)

  if (!produit) notFound()

  const initial = {
    id: produit.id,
    nom: produit.nom,
    reference: produit.reference,
    categorie: produit.categorie,
    descriptionCourte: produit.descriptionCourte,
    descriptionLongue: produit.descriptionLongue ?? '',
    prixPublic: produit.prixPublic,
    prixDevis: produit.prixDevis,
    tva: produit.tva,
    stock: produit.stock,
    seuilAlerte: produit.seuilAlerte,
    statut: produit.statut,
    estVedette: produit.estVedette,
    specifications: (produit.specifications as Spec[] | null) ?? [],
    photos: produit.photos.map((p) => ({
      id: p.id,
      url: p.url,
      estPrincipale: p.estPrincipale,
      ordre: p.ordre,
    })),
  }

  return (
    <>
      <AdminHeader titre="Modifier produit" sousTitre={produit.nom} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <ProduitForm initial={initial} />
      </div>
    </>
  )
}
