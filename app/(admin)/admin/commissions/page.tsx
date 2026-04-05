import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import CommissionsAdmin from '@/components/admin/CommissionsAdmin'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Commissions — Admin Teralite' }

export default async function AdminCommissionsPage() {
  const now = new Date()
  const debut = new Date(now.getFullYear(), now.getMonth(), 1)
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [config, vendeurs, commissionsMois] = await Promise.all([
    prisma.configCommission.findFirst({
      where: { actif: true },
      orderBy: { dateEffet: 'desc' },
    }).catch(() => null),
    prisma.utilisateur.findMany({
      where: { role: { in: ['VENDEUR', 'ADMIN'] }, actif: true },
      select: { id: true, nom: true, email: true, role: true },
      orderBy: { nom: 'asc' },
    }).catch(() => []),
    prisma.commission.findMany({
      where: { createdAt: { gte: debut, lte: fin } },
      include: {
        vendeur: { select: { id: true, nom: true, email: true } },
        commande: { select: { numero: true, montantTotal: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ])

  return (
    <>
      <AdminHeader titre="Commissions vendeurs" sousTitre="Configuration, suivi et paiement des commissions" />
      <CommissionsAdmin
        configActuelle={JSON.parse(JSON.stringify(config)) as typeof config}
        vendeurs={vendeurs}
        initialCommissions={JSON.parse(JSON.stringify(commissionsMois)) as typeof commissionsMois}
        periodeInitiale={{ annee: now.getFullYear(), mois: now.getMonth() + 1 }}
      />
    </>
  )
}
