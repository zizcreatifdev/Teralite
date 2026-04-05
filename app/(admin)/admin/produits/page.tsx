import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ArchiveBtnClient from '@/components/admin/ArchiveBtnClient'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, AlertCircle } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'
import type { TypeProduit } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Produits — Admin Teralite' }

const BADGE_STATUT: Record<TypeProduit, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-green-light text-green-teralite' },
  RUPTURE: { label: 'Rupture', cls: 'bg-red-light text-red-teralite' },
  BIENTOT: { label: 'Bientôt', cls: 'bg-orange-light text-orange-teralite' },
}

interface PageProps {
  searchParams: { categorie?: string; statut?: string; archive?: string; q?: string; page?: string }
}

export default async function AdminProduitsPage({ searchParams }: PageProps) {
  await getServerSession(authOptions)

  const { categorie, statut, archive = 'false', q, page = '1' } = searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { archive: archive === 'true' }
  if (categorie) where.categorie = categorie
  if (statut) where.statut = statut
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: 'insensitive' } },
      { reference: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [produits, total, categoriesResult] = await Promise.all([
    prisma.produit
      .findMany({
        where,
        include: { photos: { where: { estPrincipale: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limit,
        take: limit,
      })
      .catch(() => []),
    prisma.produit.count({ where }).catch(() => 0),
    prisma.produit
      .findMany({ where: { archive: false }, select: { categorie: true }, distinct: ['categorie'] })
      .catch(() => []),
  ])

  const pages = Math.ceil(total / limit)
  const qs = new URLSearchParams({
    ...(categorie ? { categorie } : {}),
    ...(statut ? { statut } : {}),
    ...(archive !== 'false' ? { archive } : {}),
    ...(q ? { q } : {}),
  })

  return (
    <>
      <AdminHeader titre="Produits" sousTitre={`${total} produit${total > 1 ? 's' : ''}`} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/produits/nouveau"
            className="flex items-center gap-2 bg-blue-teralite text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </Link>

          <form method="get" className="flex flex-wrap items-center gap-2 ml-auto">
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher…"
              className="text-sm border border-border-main rounded-lg px-3 py-2 w-44 focus:outline-none focus:border-blue-teralite"
            />
            <select
              name="categorie"
              defaultValue={categorie ?? ''}
              className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
            >
              <option value="">Toutes catégories</option>
              {categoriesResult.map((c) => (
                <option key={c.categorie} value={c.categorie}>{c.categorie}</option>
              ))}
            </select>
            <select
              name="statut"
              defaultValue={statut ?? ''}
              className="text-sm border border-border-main rounded-lg px-3 py-2 focus:outline-none focus:border-blue-teralite"
            >
              <option value="">Tous statuts</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="RUPTURE">Rupture</option>
              <option value="BIENTOT">Bientôt</option>
            </select>
            <button type="submit" className="text-sm bg-gray-fond border border-border-main px-3 py-2 rounded-lg hover:bg-border-main transition-colors">
              Filtrer
            </button>
          </form>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider w-12"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Référence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Prix</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Vedette</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {produits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-light">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                produits.map((p) => {
                  const photo = p.photos[0]
                  const stockCritique = p.stock <= p.seuilAlerte
                  return (
                    <tr key={p.id} className="hover:bg-gray-fond/50 transition-colors">
                      <td className="px-4 py-3">
                        {photo ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border-main flex-shrink-0">
                            <Image src={photo.url} alt={p.nom} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-fond border border-border-main" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-main truncate max-w-xs">{p.nom}</p>
                        <p className="text-xs text-text-light">{p.categorie}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-mid">{p.reference}</span>
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {p.prixPublic
                          ? formatFCFA(p.prixPublic)
                          : <span className="text-text-light italic text-xs">Sur devis</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {stockCritique && <AlertCircle className="w-3.5 h-3.5 text-red-teralite" />}
                          <span className={`font-medium ${stockCritique ? 'text-red-teralite' : 'text-text-main'}`}>
                            {p.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STATUT[p.statut].cls}`}>
                          {BADGE_STATUT[p.statut].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.estVedette
                          ? <span className="text-xs bg-orange-light text-orange-teralite px-2 py-0.5 rounded-full font-medium">Vedette</span>
                          : <span className="text-text-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/produits/${p.id}/modifier`}
                            className="flex items-center gap-1.5 text-xs text-blue-teralite hover:bg-blue-light px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Modifier
                          </Link>
                          {!p.archive && <ArchiveBtnClient produitId={p.id} />}
                        </div>
                      </td>
                    </tr>
                  )
                })
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
