import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ComptabiliteClient from '@/components/admin/ComptabiliteClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Comptabilité — Admin Teralite' }

export default async function AdminComptabilitePage() {
  // Données initiales : mois courant
  const now = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)

  const [recettesMois, depensesMois, factures] = await Promise.all([
    prisma.recette.aggregate({
      where: { date: { gte: debutMois } },
      _sum: { montant: true },
      _count: true,
    }).catch(() => ({ _sum: { montant: 0 }, _count: 0 })),
    prisma.depense.aggregate({
      where: { date: { gte: debutMois } },
      _sum: { montant: true },
      _count: true,
    }).catch(() => ({ _sum: { montant: 0 }, _count: 0 })),
    prisma.facture.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        commande: { select: { numero: true, client: { select: { nom: true } } } },
        devis: { select: { numero: true, client: { select: { nom: true } } } },
      },
    }).catch(() => []),
  ])

  const ca = recettesMois._sum.montant ?? 0
  const totalDepenses = depensesMois._sum.montant ?? 0

  const initialData = {
    ca,
    depenses: totalDepenses,
    benefice: ca - totalDepenses,
    marge: ca > 0 ? Math.round(((ca - totalDepenses) / ca) * 100) : 0,
  }

  return (
    <>
      <AdminHeader titre="Comptabilité" sousTitre="Finances, recettes, dépenses, factures" />
      <ComptabiliteClient
        initialKPIs={initialData}
        initialFactures={JSON.parse(JSON.stringify(factures)) as typeof factures}
      />
    </>
  )
}
