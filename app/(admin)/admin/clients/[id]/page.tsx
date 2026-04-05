import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ClientDetailClient from '@/components/admin/ClientDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await prisma.client
    .findUnique({ where: { id: params.id }, select: { nom: true } })
    .catch(() => null)
  return { title: c ? `${c.nom} — Clients Admin Teralite` : 'Client introuvable' }
}

export default async function AdminFicheClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client
    .findUnique({
      where: { id: params.id },
      include: {
        commandes: {
          select: { id: true, numero: true, statut: true, montantTotal: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        devis: {
          select: { id: true, numero: true, statut: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    .catch(() => null)

  if (!client) notFound()

  const totalDepense = client.commandes.reduce((s, c) => s + c.montantTotal, 0)
  const clientSerialise = JSON.parse(JSON.stringify({ ...client, totalDepense })) as typeof client & { totalDepense: number }

  return (
    <>
      <AdminHeader titre={client.nom} sousTitre={client.telephone} />
      <ClientDetailClient client={clientSerialise} />
    </>
  )
}
