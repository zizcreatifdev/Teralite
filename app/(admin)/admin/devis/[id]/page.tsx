import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import DevisDetailClient from '@/components/admin/DevisDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const dv = await prisma.devis
    .findUnique({ where: { id: params.id }, select: { numero: true } })
    .catch(() => null)
  return { title: dv ? `Devis ${dv.numero} — Admin Teralite` : 'Devis introuvable' }
}

export default async function AdminFicheDevisPage({ params }: { params: { id: string } }) {
  const devis = await prisma.devis
    .findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lignes: {
          include: { produit: { select: { id: true, nom: true, reference: true, prixDevis: true } } },
          orderBy: { id: 'asc' },
        },
        facture: true,
      },
    })
    .catch(() => null)

  if (!devis) notFound()

  const devisSerialise = JSON.parse(JSON.stringify(devis)) as typeof devis

  return (
    <>
      <AdminHeader titre={`Devis ${devis.numero}`} sousTitre={devis.client.nom} />
      <DevisDetailClient devis={devisSerialise} />
    </>
  )
}
