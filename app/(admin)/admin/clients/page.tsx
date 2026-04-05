import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import type { TypeClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clients — Admin Teralite' }

const TYPE_LABELS: Record<TypeClient, { label: string; cls: string }> = {
  PARTICULIER: { label: 'Particulier', cls: 'bg-blue-light text-blue-teralite' },
  ENTREPRISE: { label: 'Entreprise', cls: 'bg-orange-light text-orange-teralite' },
  MUNICIPALITE: { label: 'Municipalité', cls: 'bg-green-light text-green-teralite' },
}

interface PageProps {
  searchParams: { type?: string; q?: string; page?: string }
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const { type, q, page = '1' } = searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (type) where.type = type
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: 'insensitive' } },
      { telephone: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [clients, total] = await Promise.all([
    prisma.client
      .findMany({
        where,
        include: {
          _count: { select: { commandes: true, devis: true } },
          commandes: { select: { montantTotal: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limit,
        take: limit,
      })
      .catch(() => []),
    prisma.client.count({ where }).catch(() => 0),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <>
      <AdminHeader titre="Clients" sousTitre={`${total} client${total > 1 ? 's' : ''}`} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input
              name="q" defaultValue={q} placeholder="Rechercher…"
              className="text-sm border border-border-main rounded-lg px-3 py-2 w-44 focus:outline-none focus:border-blue-teralite"
            />
            <select name="type" defaultValue={type ?? ''}
              className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite">
              <option value="">Tous types</option>
              <option value="PARTICULIER">Particulier</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="MUNICIPALITE">Municipalité</option>
            </select>
            <button type="submit" className="text-sm bg-blue-teralite text-white px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
              Filtrer
            </button>
          </form>
          <a
            href="/api/admin/clients/export"
            className="flex items-center gap-2 text-sm border border-border-main text-text-mid px-3 py-2 rounded-lg hover:bg-gray-fond transition-colors ml-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Commandes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Total dépensé</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Depuis</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-light">Aucun client</td></tr>
              ) : (
                clients.map((c) => {
                  const totalDepense = c.commandes.reduce((s, cmd) => s + cmd.montantTotal, 0)
                  return (
                    <tr key={c.id} className="hover:bg-gray-fond/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-main">{c.nom}</p>
                        {c.email && <p className="text-xs text-text-light">{c.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-text-mid">{c.telephone}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[c.type].cls}`}>
                          {TYPE_LABELS[c.type].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-mid">{c._count.commandes}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-main">
                        {totalDepense > 0 ? formatFCFA(totalDepense) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-light">{formatDateCourte(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/clients/${c.id}`} className="text-xs text-blue-teralite hover:underline font-medium">
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
              <Link key={p} href={`?page=${p}${type ? `&type=${type}` : ''}${q ? `&q=${q}` : ''}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                  p === pageNum ? 'bg-blue-teralite text-white font-semibold' : 'text-text-mid border border-border-main hover:bg-gray-fond'
                }`}>{p}</Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
