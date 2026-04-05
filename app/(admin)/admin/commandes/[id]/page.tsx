import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import CommandeDetail from '@/components/admin/CommandeDetail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const cmd = await prisma.commande
    .findUnique({ where: { id: params.id }, select: { numero: true } })
    .catch(() => null)
  return { title: cmd ? `Commande ${cmd.numero} — Admin Teralite` : 'Commande introuvable' }
}

export default async function AdminFicheCommandePage({ params }: { params: { id: string } }) {
  const commande = await prisma.commande
    .findUnique({
      where: { id: params.id },
      include: {
        client: true,
        zone: true,
        lignes: {
          include: {
            produit: {
              include: { photos: { where: { estPrincipale: true }, take: 1 } },
            },
          },
        },
        historique: { orderBy: { createdAt: 'asc' } },
        facture: true,
      },
    })
    .catch(() => null)

  if (!commande) notFound()

  // Sérialiser les dates pour le client component
  const commandeSerializee = JSON.parse(JSON.stringify(commande)) as typeof commande

  return (
    <>
      <AdminHeader
        titre={`Commande ${commande.numero}`}
        sousTitre={commande.client.nom}
      />
      <CommandeDetail commande={commandeSerializee} />
    </>
  )
}
