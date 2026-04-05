import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ContenuEditor from '@/components/admin/ContenuEditor'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Contenu site — Admin Teralite' }

export default async function AdminContenuPage() {
  const [contenu, temoignages, faq] = await Promise.all([
    prisma.contenuSite.findMany({ orderBy: { cle: 'asc' } }).catch(() => []),
    prisma.temoignage.findMany({ orderBy: { ordre: 'asc' } }).catch(() => []),
    prisma.fAQ.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] }).catch(() => []),
  ])

  return (
    <>
      <AdminHeader titre="Contenu du site" sousTitre="Hero, témoignages, FAQ, informations contact" />
      <ContenuEditor contenu={contenu} temoignages={temoignages} faq={faq} />
    </>
  )
}
