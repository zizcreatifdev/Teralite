import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import NouveauDevisForm from '@/components/admin/NouveauDevisForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Nouveau devis — Admin Teralite' }

export default async function NouveauDevisPage() {
  const [clients, produits] = await Promise.all([
    prisma.client
      .findMany({ select: { id: true, nom: true, telephone: true }, orderBy: { nom: 'asc' }, take: 200 })
      .catch(() => []),
    prisma.produit
      .findMany({
        where: { archive: false, statut: { not: 'RUPTURE' } },
        select: { id: true, nom: true, reference: true, prixDevis: true },
        orderBy: { nom: 'asc' },
        take: 200,
      })
      .catch(() => []),
  ])

  return (
    <>
      <AdminHeader titre="Nouveau devis" sousTitre="Créer un devis pour un client" />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <NouveauDevisForm clients={clients} produits={produits} />
      </div>
    </>
  )
}
