'use client'

import { useState } from 'react'
import { Search, Loader2, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { StatutCommande } from '@prisma/client'

interface HistoriqueItem {
  statut: StatutCommande
  note: string | null
  createdAt: string
}

interface CommandeResult {
  numero: string
  statut: StatutCommande
  createdAt: string
  montantTotal: number
  historique: HistoriqueItem[]
}

const statutConfig: Record<StatutCommande, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  RECUE:              { label: 'Commande reçue',           color: 'text-blue-teralite',   Icon: Package },
  CONFIRMEE:          { label: 'Confirmée',                 color: 'text-blue-teralite',   Icon: CheckCircle },
  EN_PREPARATION:     { label: 'En préparation',            color: 'text-orange-teralite', Icon: Clock },
  EXPEDIEE:           { label: 'Expédiée',                  color: 'text-orange-teralite', Icon: Truck },
  LIVREE:             { label: 'Livrée ✓',                  color: 'text-green-teralite',  Icon: CheckCircle },
  ANNULEE:            { label: 'Annulée',                   color: 'text-red-teralite',    Icon: XCircle },
  EN_ATTENTE_PAIEMENT:{ label: 'En attente de paiement',   color: 'text-text-light',      Icon: Clock },
}

export default function SuiviForm() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CommandeResult | null>(null)
  const [erreur, setErreur] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setErreur('')
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch(
        `/api/commandes/suivi?q=${encodeURIComponent(query.trim())}`
      )
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error ?? 'Commande introuvable.')
      } else {
        setResult(data)
      }
    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-border-main p-6 mb-6">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Numéro de commande ou téléphone
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="#0042 ou +221 77 000 00 00"
            className="flex-1 border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                       focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                       placeholder:text-text-light transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-teralite hover:bg-blue-dark text-white px-5 py-2.5 rounded-lg transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
      </form>

      {erreur && (
        <div className="bg-red-light border border-red-teralite/30 rounded-xl px-5 py-4 text-sm text-red-teralite">
          {erreur}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-border-main overflow-hidden">
          <div className="px-6 py-5 border-b border-border-main flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-text-light mb-1">Commande</p>
              <p className="text-lg font-semibold text-text-main font-mono">{result.numero}</p>
            </div>
            <div className={`font-medium text-sm ${statutConfig[result.statut].color}`}>
              {statutConfig[result.statut].label}
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-4">
              Historique
            </p>
            <div className="space-y-3">
              {result.historique.map((h, i) => {
                const config = statutConfig[h.statut]
                const Icon = config.Icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-text-light">
                          {formatDate(new Date(h.createdAt))}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-text-mid mt-0.5">{h.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
