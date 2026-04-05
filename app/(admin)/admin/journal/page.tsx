import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import JournalClient from '@/components/admin/JournalClient'
import type { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Journal d\'activité — Admin Teralite' }

interface EntreeRaw {
  id: string
  action: string
  details: Record<string, unknown> | null
  createdAt: Date
  utilisateur?: { id: string; nom: string; email: string; role: Role } | null
}

export default async function AdminJournalPage() {
  const [entrees, utilisateurs] = await Promise.all([
    prisma.journalActivite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
      },
    }).catch(() => [] as EntreeRaw[]),
    prisma.utilisateur.findMany({
      select: { id: true, nom: true, role: true },
      orderBy: { nom: 'asc' },
    }).catch(() => [] as { id: string; nom: string; role: Role }[]),
  ])

  return (
    <>
      <AdminHeader titre="Journal d'activité" sousTitre="Historique de toutes les actions administratives" />
      <JournalClient
        initialEntrees={JSON.parse(JSON.stringify(entrees)) as EntreeRaw[]}
        utilisateurs={utilisateurs}
      />
    </>
  )
}
