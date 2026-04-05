import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import PromotionsManager from '@/components/admin/PromotionsManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Promotions — Admin Teralite' }

export default async function AdminPromotionsPage() {
  const [promos, banniereKeys] = await Promise.all([
    prisma.codePromo.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
    prisma.contenuSite
      .findMany({
        where: { cle: { in: ['banniere_active', 'banniere_texte', 'banniere_couleur'] } },
      })
      .catch(() => []),
  ])

  const banniereMap = Object.fromEntries(banniereKeys.map((k) => [k.cle, k.valeur]))
  const banniereContenu = {
    banniere_active: banniereMap['banniere_active'] ?? 'false',
    banniere_texte: banniereMap['banniere_texte'] ?? '',
    banniere_couleur: banniereMap['banniere_couleur'] ?? '#FFA000',
  }

  const promosSerialises = JSON.parse(JSON.stringify(promos)) as typeof promos

  return (
    <>
      <AdminHeader titre="Promotions" sousTitre="Codes promo et bannière promotionnelle" />
      <PromotionsManager promos={promosSerialises} banniereContenu={banniereContenu} />
    </>
  )
}
