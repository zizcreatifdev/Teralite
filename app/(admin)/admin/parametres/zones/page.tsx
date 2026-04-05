import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ZonesManager from '@/components/admin/ZonesManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Zones de livraison — Admin Teralite' }

export default async function AdminZonesPage() {
  const zones = await prisma.zoneLivraison
    .findMany({
      orderBy: { nom: 'asc' },
      include: { _count: { select: { commandes: true } } },
    })
    .catch(() => [])

  const zonesSerialises = JSON.parse(JSON.stringify(zones)) as typeof zones

  return (
    <>
      <AdminHeader titre="Zones de livraison" sousTitre="Tarifs et délais par zone géographique" />
      <ZonesManager zones={zonesSerialises} />
    </>
  )
}
