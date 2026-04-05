import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import { STATUT_DEVIS_LABELS } from '@/types/index'
import type { StatutDevis } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Devis — Admin Teralite' }

const BADGE: Record<StatutDevis, string> = {
  NOUVEAU: 'bg-orange-light text-orange-teralite',
  EN_COURS: 'bg-blue-light text-blue-teralite',
  ENVOYE: 'bg-blue-light text-blue-dark',
  ACCEPTE: 'bg-green-light text-green-teralite',
  REFUSE: 'bg-red-light text-red-teralite',
}

interface PageProps {
  searchParams: { statut?: string; q?: string; page?: string }
}

export default async function AdminDevisPage({ searchParams }: PageProps) {
  const { statut, q, page = '1' } = searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (statut) where.statut = statut
  if (q) {
    where.OR = [
      { numero: { contains: q, mode: 'insensitive' } },
      { client: { nom: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [devis, total] = await Promise.all([
    prisma.devis
      .findMany({
        where,
        include: {
          client: { select: { nom: true, telephone: true } },
          lignes: { select: { sousTotal: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limit,
        take: limit,
      })
      .catch(() => []),
    prisma.devis.count({ where }).catch(() => 0),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <>
      <AdminHeader titre="Devis" sousTitre={`${total} devis au total`} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/devis/nouveau"
            className="flex items-center gap-2 bg-blue-teralite text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau devis
          </Link>

          {/* Filtres statut */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Link
              href="/admin/devis"
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                !statut ? 'bg-blue-teralite text-white border-blue-teralite' : 'text-text-mid border-border-main hover:bg-gray-fond'
              }`}
            >
              Tous
            </Link>
            {(Object.keys(STATUT_DEVIS_LABELS) as StatutDevis[]).map((s) => (
              <Link
                key={s}
                href={`/admin/devis?statut=${s}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                  statut === s ? 'bg-blue-teralite text-white border-blue-teralite' : `${BADGE[s]} border-transparent hover:opacity-80`
                }`}
              >
                {STATUT_DEVIS_LABELS[s]}
              </Link>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">N°</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Lignes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Total HT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {devis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-light">Aucun devis</td>
                </tr>
              ) : (
                devis.map((dv) => {
                  const total = dv.lignes.reduce((s, l) => s + l.sousTotal, 0)
                  return (
                    <tr key={dv.id} className="hover:bg-gray-fond/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-teralite">{dv.numero}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-main">{dv.client.nom}</p>
                        <p className="text-xs text-text-light">{dv.client.telephone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-mid">{formatDateCourte(dv.createdAt)}</td>
                      <td className="px-4 py-3 text-right text-text-mid">{dv._count.lignes}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-main">{formatFCFA(total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[dv.statut]}`}>
                          {STATUT_DEVIS_LABELS[dv.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/devis/${dv.id}`} className="text-xs text-blue-teralite hover:underline font-medium">
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?page=${p}${statut ? `&statut=${statut}` : ''}${q ? `&q=${q}` : ''}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                  p === pageNum ? 'bg-blue-teralite text-white font-semibold' : 'text-text-mid border border-border-main hover:bg-gray-fond'
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
