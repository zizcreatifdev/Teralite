import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import DashboardCharts from '@/components/admin/DashboardCharts'
import Link from 'next/link'
import { AlertTriangle, AlertCircle, Package, ShoppingCart } from 'lucide-react'
import { STATUT_COMMANDE_LABELS, STATUT_DEVIS_LABELS, TYPE_PAIEMENT_LABELS } from '@/types/index'
import { formatFCFA, formatDate } from '@/lib/utils'
import type { StatutCommande, StatutDevis, TypePaiement } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Tableau de bord — Teralite Admin' }

// Couleurs badges statut commande
const BADGE_STATUT: Record<StatutCommande, string> = {
  RECUE: 'bg-blue-light text-blue-teralite',
  EN_ATTENTE_PAIEMENT: 'bg-orange-light text-orange-teralite',
  CONFIRMEE: 'bg-green-light text-green-teralite',
  EN_PREPARATION: 'bg-blue-light text-blue-teralite',
  EXPEDIEE: 'bg-blue-light text-blue-dark',
  LIVREE: 'bg-green-light text-green-teralite',
  ANNULEE: 'bg-red-light text-red-teralite',
}

const BADGE_DEVIS: Record<StatutDevis, string> = {
  NOUVEAU: 'bg-blue-light text-blue-teralite',
  EN_COURS: 'bg-orange-light text-orange-teralite',
  ENVOYE: 'bg-blue-light text-blue-dark',
  ACCEPTE: 'bg-green-light text-green-teralite',
  REFUSE: 'bg-red-light text-red-teralite',
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  const maintenant = new Date()
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
  const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
  const il48h = new Date(maintenant.getTime() - 48 * 60 * 60 * 1000)

  // Toutes les requêtes DB en parallèle
  const [
    commandesMois,
    caJour,
    devisEnAttente,
    nouveauxClients,
    devisNonTraites,
    produitsStockCritique,
    dernieresCommandes,
    derniersDevis,
    ventesParJour,
    repartitionPaiements,
  ] = await Promise.all([
    prisma.commande.count({ where: { createdAt: { gte: debutMois } } }).catch(() => 0),

    prisma.commande
      .aggregate({
        where: {
          createdAt: { gte: debutJour },
          statut: { in: ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
        },
        _sum: { montantTotal: true },
      })
      .catch(() => ({ _sum: { montantTotal: 0 } })),

    prisma.devis
      .count({ where: { statut: { in: ['NOUVEAU', 'EN_COURS'] } } })
      .catch(() => 0),

    prisma.client
      .count({ where: { createdAt: { gte: debutMois } } })
      .catch(() => 0),

    prisma.devis
      .count({
        where: { statut: { in: ['NOUVEAU', 'EN_COURS'] }, createdAt: { lte: il48h } },
      })
      .catch(() => 0),

    prisma.produit
      .findMany({
        where: { archive: false, stock: { lte: prisma.produit.fields.seuilAlerte } },
        select: { id: true, nom: true, stock: true, seuilAlerte: true },
        take: 5,
      })
      .catch(() => []),

    prisma.commande
      .findMany({
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      .catch(() => []),

    prisma.devis
      .findMany({
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      })
      .catch(() => []),

    // Ventes des 30 derniers jours regroupées par jour
    prisma.commande
      .findMany({
        where: {
          createdAt: { gte: new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000) },
          statut: { in: ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
        },
        select: { createdAt: true, montantTotal: true },
        orderBy: { createdAt: 'asc' },
      })
      .catch(() => []),

    prisma.commande
      .groupBy({
        by: ['typePaiement'],
        _count: { typePaiement: true },
      })
      .catch(() => []),
  ])

  // Agréger les ventes par jour
  const ventesMap: Record<string, number> = {}
  for (const cmd of ventesParJour) {
    const jour = cmd.createdAt.toISOString().split('T')[0]
    ventesMap[jour] = (ventesMap[jour] ?? 0) + cmd.montantTotal
  }
  const ventesData = Object.entries(ventesMap).map(([date, montant]) => ({ date, montant }))

  // Répartition paiements pour donut
  const COULEURS_PAIEMENT: Record<TypePaiement, string> = {
    ORANGE_MONEY: '#FF6600',
    WAVE: '#1A73E8',
    YAS: '#8B5CF6',
    CASH: '#1A6B3A',
  }
  const repartitionData = repartitionPaiements.map((r) => ({
    nom: TYPE_PAIEMENT_LABELS[r.typePaiement as TypePaiement],
    valeur: r._count.typePaiement,
    couleur: COULEURS_PAIEMENT[r.typePaiement as TypePaiement] ?? '#888',
  }))

  const caJourMontant = caJour._sum.montantTotal ?? 0

  return (
    <>
      <AdminHeader
        titre="Tableau de bord"
        sousTitre={`${formatDate(maintenant)} · Bienvenue, ${session?.user?.name ?? 'Administrateur'}`}
      />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">

        {/* Alertes */}
        {(devisNonTraites > 0 || produitsStockCritique.length > 0) && (
          <div className="space-y-2">
            {devisNonTraites > 0 && (
              <div className="flex items-center gap-3 bg-orange-light border border-orange-teralite/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-orange-teralite flex-shrink-0" />
                <p className="text-sm text-orange-teralite font-medium">
                  {devisNonTraites} devis{devisNonTraites > 1 ? '' : ''} non traité{devisNonTraites > 1 ? 's' : ''} depuis plus de 48h
                </p>
                <Link href="/admin/devis" className="ml-auto text-xs font-semibold text-orange-teralite underline-offset-2 hover:underline">
                  Voir les devis →
                </Link>
              </div>
            )}
            {produitsStockCritique.length > 0 && (
              <div className="flex items-center gap-3 bg-red-light border border-red-teralite/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-teralite flex-shrink-0" />
                <p className="text-sm text-red-teralite font-medium">
                  {produitsStockCritique.length} produit{produitsStockCritique.length > 1 ? 's' : ''} en stock critique
                </p>
                <Link href="/admin/produits" className="ml-auto text-xs font-semibold text-red-teralite underline-offset-2 hover:underline">
                  Gérer les stocks →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-teralite rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <ShoppingCart className="w-5 h-5 text-white/60" />
              <span className="text-xs text-white/50 uppercase tracking-wider">Ce mois</span>
            </div>
            <p className="text-3xl font-semibold">{commandesMois}</p>
            <p className="text-xs text-white/60 mt-1">Commandes</p>
          </div>

          <div className="bg-orange-teralite rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-lg font-bold">F</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">Aujourd&apos;hui</span>
            </div>
            <p className="text-2xl font-semibold">{formatFCFA(caJourMontant)}</p>
            <p className="text-xs text-white/60 mt-1">Chiffre d&apos;affaires</p>
          </div>

          <div className="bg-green-teralite rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Package className="w-5 h-5 text-white/60" />
              <span className="text-xs text-white/50 uppercase tracking-wider">En attente</span>
            </div>
            <p className="text-3xl font-semibold">{devisEnAttente}</p>
            <p className="text-xs text-white/60 mt-1">Devis à traiter</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-border-main">
            <div className="flex items-center justify-between mb-3">
              <span className="w-5 h-5 rounded-full bg-blue-light flex items-center justify-center">
                <span className="text-blue-teralite text-xs font-bold">+</span>
              </span>
              <span className="text-xs text-text-light uppercase tracking-wider">Ce mois</span>
            </div>
            <p className="text-3xl font-semibold text-text-main">{nouveauxClients}</p>
            <p className="text-xs text-text-light mt-1">Nouveaux clients</p>
          </div>
        </div>

        {/* Charts — client component */}
        <DashboardCharts ventesData={ventesData} repartitionData={repartitionData} />

        {/* Tables côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Dernières commandes */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Dernières commandes</h2>
              <Link href="/admin/commandes" className="text-xs text-blue-teralite hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="divide-y divide-border-main">
              {dernieresCommandes.length === 0 ? (
                <p className="text-sm text-text-light px-5 py-8 text-center">Aucune commande</p>
              ) : (
                dernieresCommandes.map((cmd) => (
                  <Link
                    key={cmd.id}
                    href={`/admin/commandes/${cmd.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-fond transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main font-mono">{cmd.numero}</p>
                      <p className="text-xs text-text-light truncate">{cmd.client.nom}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text-main">{formatFCFA(cmd.montantTotal)}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STATUT[cmd.statut]}`}>
                        {STATUT_COMMANDE_LABELS[cmd.statut]}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Derniers devis */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Derniers devis</h2>
              <Link href="/admin/devis" className="text-xs text-blue-teralite hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="divide-y divide-border-main">
              {derniersDevis.length === 0 ? (
                <p className="text-sm text-text-light px-5 py-8 text-center">Aucun devis</p>
              ) : (
                derniersDevis.map((dv) => (
                  <div key={dv.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main font-mono">{dv.numero}</p>
                      <p className="text-xs text-text-light truncate">{dv.client.nom}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-text-light">{formatDate(dv.createdAt)}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_DEVIS[dv.statut]}`}>
                        {STATUT_DEVIS_LABELS[dv.statut]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
