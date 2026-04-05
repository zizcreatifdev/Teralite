import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import UtilisateursManager from '@/components/admin/UtilisateursManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Équipe — Admin Teralite' }

export default async function AdminUtilisateursPage() {
  const utilisateurs = await prisma.utilisateur.findMany({
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      actif: true,
      createdAt: true,
      _count: { select: { commissions: true } },
    },
    orderBy: [{ role: 'asc' }, { nom: 'asc' }],
  }).catch(() => [])

  return (
    <>
      <AdminHeader titre="Gestion de l'équipe" sousTitre="Comptes utilisateurs, rôles et accès" />
      <UtilisateursManager
        utilisateurs={JSON.parse(JSON.stringify(utilisateurs)) as typeof utilisateurs}
      />
    </>
  )
}
