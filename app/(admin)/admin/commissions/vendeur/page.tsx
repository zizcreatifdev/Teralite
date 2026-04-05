import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import CommissionsVendeur from '@/components/admin/CommissionsVendeur'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mes commissions — Teralite' }

export default async function CommissionsVendeurPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const vendeurId = session.user.id
  const now = new Date()
  const debut = new Date(now.getFullYear(), now.getMonth(), 1)
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [commissionsMois, historique, commandesMois] = await Promise.all([
    prisma.commission.findMany({
      where: { vendeurId, createdAt: { gte: debut, lte: fin } },
      include: {
        commande: { select: { numero: true, montantTotal: true, createdAt: true, statut: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.commission.findMany({
      where: { vendeurId, statut: 'PAYEE' },
      include: {
        commande: { select: { numero: true, montantTotal: true, createdAt: true } },
      },
      orderBy: { payeeLe: 'desc' },
      take: 24,
    }).catch(() => []),
    prisma.commande.findMany({
      where: { vendeurId, createdAt: { gte: debut, lte: fin } },
      select: { montantTotal: true },
    }).catch(() => []),
  ])

  const caGenere = commandesMois.reduce((s, c) => s + c.montantTotal, 0)
  const commissionDuMois = commissionsMois
    .filter((c) => c.statut !== 'ANNULEE')
    .reduce((s, c) => s + c.montant, 0)
  const enAttente = commissionsMois
    .filter((c) => c.statut === 'EN_ATTENTE')
    .reduce((s, c) => s + c.montant, 0)

  return (
    <>
      <AdminHeader
        titre="Mes commissions"
        sousTitre={`${session.user.name ?? session.user.email} · ${now.toLocaleDateString('fr-SN', { month: 'long', year: 'numeric' })}`}
      />
      <CommissionsVendeur
        nbVentes={commandesMois.length}
        caGenere={caGenere}
        commissionDuMois={commissionDuMois}
        enAttente={enAttente}
        commissionsMois={JSON.parse(JSON.stringify(commissionsMois)) as typeof commissionsMois}
        historique={JSON.parse(JSON.stringify(historique)) as typeof historique}
        periodeInitiale={{ annee: now.getFullYear(), mois: now.getMonth() + 1 }}
      />
    </>
  )
}
