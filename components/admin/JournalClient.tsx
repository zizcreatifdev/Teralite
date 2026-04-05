'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import type { Role } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EntreeJournal {
  id: string
  action: string
  details: Record<string, unknown> | null
  createdAt: string | Date
  utilisateur?: {
    id: string
    nom: string
    email: string
    role: Role
  } | null
}

interface Props {
  initialEntrees: EntreeJournal[]
  utilisateurs: { id: string; nom: string; role: Role }[]
}

// ─── Labels actions ───────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CONNEXION: { label: 'Connexion', color: 'bg-blue-light text-blue-teralite' },
  PRODUIT_CREE: { label: 'Produit créé', color: 'bg-green-light text-green-teralite' },
  PRODUIT_MODIFIE: { label: 'Produit modifié', color: 'bg-blue-light text-blue-dark' },
  PRODUIT_ARCHIVE: { label: 'Produit archivé', color: 'bg-orange-light text-orange-teralite' },
  COMMANDE_STATUT_CHANGE: { label: 'Statut commande', color: 'bg-blue-light text-blue-teralite' },
  COMMISSION_PAYEE: { label: 'Commission payée', color: 'bg-green-light text-green-teralite' },
  PARAMETRES_MODIFIES: { label: 'Paramètres modifiés', color: 'bg-orange-light text-orange-teralite' },
  UTILISATEUR_CREE: { label: 'Utilisateur créé', color: 'bg-green-light text-green-teralite' },
  UTILISATEUR_TOGGLE: { label: 'Compte toggle', color: 'bg-orange-light text-orange-teralite' },
  DEVIS_CREE: { label: 'Devis créé', color: 'bg-blue-light text-blue-teralite' },
  DEVIS_STATUT_CHANGE: { label: 'Statut devis', color: 'bg-blue-light text-blue-dark' },
  DEVIS_CONVERTI: { label: 'Devis converti', color: 'bg-green-light text-green-teralite' },
  CONFIG_COMMISSION_MODIFIEE: { label: 'Config commission', color: 'bg-orange-light text-orange-teralite' },
  DEPENSE_CREEE: { label: 'Dépense créée', color: 'bg-red-light text-red-teralite' },
}

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-light text-red-teralite',
  ADMIN: 'bg-blue-light text-blue-teralite',
  VENDEUR: 'bg-green-light text-green-teralite',
}

const ACTIONS_DISPONIBLES = Object.keys(ACTION_LABELS)

// ─── Component ────────────────────────────────────────────────────────────────

export default function JournalClient({ initialEntrees, utilisateurs }: Props) {
  const [entrees, setEntrees] = useState<EntreeJournal[]>(initialEntrees)
  const [loading, setLoading] = useState(false)
  const [filtreUtilisateur, setFiltreUtilisateur] = useState('')
  const [filtreAction, setFiltreAction] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const charger = useCallback(async (p = 1, utilisateurId = filtreUtilisateur, action = filtreAction) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (utilisateurId) params.set('utilisateurId', utilisateurId)
      if (action) params.set('action', action)
      const res = await fetch(`/api/admin/journal?${params.toString()}`)
      if (res.ok) {
        const d = await res.json() as { entrees: EntreeJournal[]; total: number; pages: number }
        setEntrees(d.entrees)
        setTotalPages(d.pages)
        setPage(p)
      }
    } finally {
      setLoading(false)
    }
  }, [filtreUtilisateur, filtreAction])

  const appliquerFiltres = () => charger(1, filtreUtilisateur, filtreAction)

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return '—'
    const entries = Object.entries(details)
    if (entries.length === 0) return '—'
    return entries
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .join(' · ')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4">

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtreUtilisateur} onChange={(e) => setFiltreUtilisateur(e.target.value)}
          className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
          <option value="">Tous les utilisateurs</option>
          {utilisateurs.map((u) => (
            <option key={u.id} value={u.id}>{u.nom}</option>
          ))}
        </select>

        <select value={filtreAction} onChange={(e) => setFiltreAction(e.target.value)}
          className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
          <option value="">Toutes les actions</option>
          {ACTIONS_DISPONIBLES.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
          ))}
        </select>

        <button onClick={appliquerFiltres}
          className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
          <Search className="w-4 h-4" />Filtrer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-main bg-gray-fond">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-text-light">Chargement…</td></tr>
            ) : entrees.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-text-light">Aucune entrée dans le journal</td></tr>
            ) : (
              entrees.map((e) => {
                const actionInfo = ACTION_LABELS[e.action]
                return (
                  <tr key={e.id} className="hover:bg-gray-fond/50">
                    <td className="px-4 py-3 text-xs text-text-mid whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString('fr-SN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {e.utilisateur ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            e.utilisateur.role === 'SUPER_ADMIN' ? 'bg-red-teralite'
                              : e.utilisateur.role === 'ADMIN' ? 'bg-blue-teralite'
                              : 'bg-green-teralite'
                          }`}>
                            {e.utilisateur.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-text-main">{e.utilisateur.nom}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[e.utilisateur.role]}`}>
                              {e.utilisateur.role}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-light text-xs">Système</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        actionInfo?.color ?? 'bg-gray-fond text-text-mid'
                      }`}>
                        {actionInfo?.label ?? e.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-mid max-w-xs truncate">
                      {formatDetails(e.details as Record<string, unknown> | null)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => charger(page - 1)} disabled={page === 1 || loading}
            className="text-sm px-3 py-1.5 border border-border-main rounded-lg disabled:opacity-40 hover:bg-gray-fond">
            ← Précédent
          </button>
          <span className="text-sm text-text-mid">Page {page} / {totalPages}</span>
          <button onClick={() => charger(page + 1)} disabled={page === totalPages || loading}
            className="text-sm px-3 py-1.5 border border-border-main rounded-lg disabled:opacity-40 hover:bg-gray-fond">
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
