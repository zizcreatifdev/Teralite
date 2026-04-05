import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import { STATUT_COMMANDE_LABELS, TYPE_PAIEMENT_LABELS } from '@/types/index'
import type { StatutCommande, TypePaiement } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Commandes — Admin Teralite' }

const BADGE_STATUT: Record<StatutCommande, string> = {
  RECUE: 'bg-blue-light text-blue-teralite',
  EN_ATTENTE_PAIEMENT: 'bg-orange-light text-orange-teralite',
  CONFIRMEE: 'bg-green-light text-green-teralite',
  EN_PREPARATION: 'bg-blue-light text-blue-dark',
  EXPEDIEE: 'bg-blue-light text-blue-dark',
  LIVREE: 'bg-green-light text-green-teralite',
  ANNULEE: 'bg-red-light text-red-teralite',
}

const BADGE_PAIEMENT: Record<TypePaiement, string> = {
  ORANGE_MONEY: 'bg-orange-light text-orange-teralite',
  WAVE: 'bg-blue-light text-blue-teralite',
  YAS: 'bg-purple-100 text-purple-700',
  CASH: 'bg-green-light text-green-teralite',
}

interface PageProps {
  searchParams: {
    statut?: string
    typePaiement?: string
    dateDebut?: string
    dateFin?: string
    q?: string
    page?: string
  }
}

export default async function AdminCommandesPage({ searchParams }: PageProps) {
  const { statut, typePaiement, dateDebut, dateFin, q, page = '1' } = searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (statut) where.statut = statut
  if (typePaiement) where.typePaiement = typePaiement
  if (dateDebut || dateFin) {
    where.createdAt = {}
    if (dateDebut) where.createdAt.gte = new Date(dateDebut)
    if (dateFin) {
      const fin = new Date(dateFin)
      fin.setHours(23, 59, 59, 999)
      where.createdAt.lte = fin
    }
  }
  if (q) {
    where.OR = [
      { numero: { contains: q, mode: 'insensitive' } },
      { client: { nom: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [commandes, total] = await Promise.all([
    prisma.commande
      .findMany({
        where,
        include: {
          client: { select: { nom: true, telephone: true } },
          zone: { select: { nom: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limit,
        take: limit,
      })
      .catch(() => []),
    prisma.commande.count({ where }).catch(() => 0),
  ])

  const pages = Math.ceil(total / limit)
  const qs = new URLSearchParams({
    ...(statut ? { statut } : {}),
    ...(typePaiement ? { typePaiement } : {}),
    ...(dateDebut ? { dateDebut } : {}),
    ...(dateFin ? { dateFin } : {}),
    ...(q ? { q } : {}),
  })

  return (
    <>
      <AdminHeader titre="Commandes" sousTitre={`${total} commande${total > 1 ? 's' : ''}`} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">

        {/* Filtres */}
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Numéro ou client…"
            className="text-sm border border-border-main rounded-lg px-3 py-2 w-44 focus:outline-none focus:border-blue-teralite"
          />
          <select
            name="statut"
            defaultValue={statut ?? ''}
            className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
          >
            <option value="">Tous statuts</option>
            {(Object.keys(STATUT_COMMANDE_LABELS) as StatutCommande[]).map((s) => (
              <option key={s} value={s}>{STATUT_COMMANDE_LABELS[s]}</option>
            ))}
          </select>
          <select
            name="typePaiement"
            defaultValue={typePaiement ?? ''}
            className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
          >
            <option value="">Tous paiements</option>
            {(Object.keys(TYPE_PAIEMENT_LABELS) as TypePaiement[]).map((t) => (
              <option key={t} value={t}>{TYPE_PAIEMENT_LABELS[t]}</option>
            ))}
          </select>
          <input
            type="date"
            name="dateDebut"
            defaultValue={dateDebut}
            className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
          />
          <span className="text-text-light text-sm">→</span>
          <input
            type="date"
            name="dateFin"
            defaultValue={dateFin}
            className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
          />
          <button type="submit" className="text-sm bg-blue-teralite text-white px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
            Filtrer
          </button>
          {(statut || typePaiement || dateDebut || dateFin || q) && (
            <Link href="/admin/commandes" className="text-sm text-text-light hover:text-text-main px-3 py-2">
              Réinitialiser
            </Link>
          )}
        </form>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">N°</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Paiement</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Zone</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Lignes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {commandes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-text-light">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                commandes.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-fond/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-teralite">
                      {cmd.numero}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-main">{cmd.client.nom}</p>
                      <p className="text-xs text-text-light">{cmd.client.telephone}</p>
                    </td>
                    <td className="px-4 py-3 text-text-mid text-xs">
                      {formatDateCourte(cmd.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_PAIEMENT[cmd.typePaiement]}`}>
                        {TYPE_PAIEMENT_LABELS[cmd.typePaiement]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-main">
                      {formatFCFA(cmd.montantTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STATUT[cmd.statut]}`}>
                        {STATUT_COMMANDE_LABELS[cmd.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light">
                      {cmd.zone?.nom ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-text-mid">
                      {cmd._count.lignes}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/commandes/${cmd.id}`}
                        className="text-xs text-blue-teralite hover:underline font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?page=${p}&${qs.toString()}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                  p === pageNum
                    ? 'bg-blue-teralite text-white font-semibold'
                    : 'text-text-mid hover:bg-gray-fond border border-border-main'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
