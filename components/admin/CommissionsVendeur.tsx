'use client'

import { useState, useCallback } from 'react'
import { TrendingUp, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import type { StatutCommission, StatutCommande } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommissionItem {
  id: string
  montant: number
  statut: StatutCommission
  notePaiement: string | null
  payeeLe: string | Date | null
  createdAt: string | Date
  commande: {
    numero: string
    montantTotal: number
    createdAt: string | Date
    statut?: StatutCommande
  }
}

interface Props {
  nbVentes: number
  caGenere: number
  commissionDuMois: number
  enAttente: number
  commissionsMois: CommissionItem[]
  historique: CommissionItem[]
  periodeInitiale: { annee: number; mois: number }
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUT_BADGE: Record<StatutCommission, string> = {
  EN_ATTENTE: 'bg-orange-light text-orange-teralite',
  VALIDEE: 'bg-blue-light text-blue-teralite',
  PAYEE: 'bg-green-light text-green-teralite',
  ANNULEE: 'bg-red-light text-red-teralite',
}

const STATUT_LABELS: Record<StatutCommission, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommissionsVendeur({
  nbVentes: initialNbVentes,
  caGenere: initialCa,
  commissionDuMois: initialCommission,
  enAttente: initialEnAttente,
  commissionsMois: initialMois,
  historique: initialHistorique,
  periodeInitiale,
}: Props) {
  const [annee, setAnnee] = useState(periodeInitiale.annee)
  const [mois, setMois] = useState(periodeInitiale.mois)
  const [loading, setLoading] = useState(false)

  const [nbVentes, setNbVentes] = useState(initialNbVentes)
  const [caGenere, setCaGenere] = useState(initialCa)
  const [commissionDuMois, setCommissionDuMois] = useState(initialCommission)
  const [enAttente, setEnAttente] = useState(initialEnAttente)
  const [commissionsMois, setCommissionsMois] = useState(initialMois)
  const [historique] = useState(initialHistorique)

  const chargerPeriode = useCallback(async (a: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/commissions/vendeur?annee=${a}&mois=${m}`)
      if (res.ok) {
        const d = await res.json() as {
          nbVentes: number
          caGenere: number
          commissionDuMois: number
          enAttente: number
          commissionsMois: CommissionItem[]
        }
        setNbVentes(d.nbVentes)
        setCaGenere(d.caGenere)
        setCommissionDuMois(d.commissionDuMois)
        setEnAttente(d.enAttente)
        setCommissionsMois(d.commissionsMois)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const changerPeriode = (a: number, m: number) => {
    setAnnee(a)
    setMois(m)
    chargerPeriode(a, m)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

      {/* Sélecteur période */}
      <div className="flex items-center gap-2">
        <select value={mois} onChange={(e) => changerPeriode(annee, parseInt(e.target.value))}
          className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
          {MOIS_LABELS.map((label, i) => (
            <option key={i + 1} value={i + 1}>{label}</option>
          ))}
        </select>
        <input type="number" min={2020} max={2099} value={annee}
          onChange={(e) => changerPeriode(parseInt(e.target.value), mois)}
          className="border border-border-main rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-blue-teralite" />
        {loading && <span className="text-xs text-text-light">Chargement…</span>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border-main p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-light uppercase tracking-wider">Mes ventes</p>
            <div className="w-8 h-8 rounded-lg bg-blue-light flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-teralite" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-text-main">{nbVentes}</p>
          <p className="text-xs text-text-light mt-1">commande{nbVentes > 1 ? 's' : ''} ce mois</p>
        </div>

        <div className="bg-white rounded-xl border border-border-main p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-light uppercase tracking-wider">CA généré</p>
            <div className="w-8 h-8 rounded-lg bg-blue-light flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-teralite" />
            </div>
          </div>
          <p className="text-xl font-semibold text-text-main">{formatFCFA(caGenere)}</p>
        </div>

        <div className="bg-blue-teralite rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Ma commission</p>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xl font-semibold">{formatFCFA(commissionDuMois)}</p>
          <p className="text-xs text-white/60 mt-1">{MOIS_LABELS[mois - 1]} {annee}</p>
        </div>

        <div className="bg-white rounded-xl border border-border-main p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-light uppercase tracking-wider">En attente</p>
            <div className="w-8 h-8 rounded-lg bg-orange-light flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-teralite" />
            </div>
          </div>
          <p className="text-xl font-semibold text-orange-teralite">{formatFCFA(enAttente)}</p>
          <p className="text-xs text-text-light mt-1">paiement en cours</p>
        </div>
      </div>

      {/* Commissions du mois */}
      <div className="bg-white rounded-xl border border-border-main overflow-hidden">
        <div className="px-5 py-4 border-b border-border-main">
          <h2 className="text-sm font-semibold text-text-main">
            Commissions — {MOIS_LABELS[mois - 1]} {annee}
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-main bg-gray-fond">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Commande</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">CA vente</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Ma commission</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main">
            {commissionsMois.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-text-light text-sm">
                  Aucune commission sur cette période
                </td>
              </tr>
            ) : (
              commissionsMois.map((c) => (
                <tr key={c.id} className="hover:bg-gray-fond/50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-teralite text-xs">{c.commande.numero}</td>
                  <td className="px-4 py-3 text-xs text-text-mid">{formatDateCourte(new Date(c.commande.createdAt))}</td>
                  <td className="px-4 py-3 text-right text-text-mid">{formatFCFA(c.commande.montantTotal)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text-main">{formatFCFA(c.montant)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_BADGE[c.statut]}`}>
                      {STATUT_LABELS[c.statut]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Historique des paiements reçus */}
      <div className="bg-white rounded-xl border border-border-main overflow-hidden">
        <div className="px-5 py-4 border-b border-border-main">
          <h2 className="text-sm font-semibold text-text-main">Historique des paiements reçus</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-main bg-gray-fond">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Commande</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Payé le</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main">
            {historique.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-text-light text-sm">
                  Aucun paiement enregistré
                </td>
              </tr>
            ) : (
              historique.map((c) => (
                <tr key={c.id} className="hover:bg-gray-fond/50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-teralite text-xs">{c.commande.numero}</td>
                  <td className="px-4 py-3 text-xs text-text-mid">
                    {c.payeeLe ? formatDateCourte(new Date(c.payeeLe)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-teralite">{formatFCFA(c.montant)}</td>
                  <td className="px-4 py-3 text-xs text-text-mid">{c.notePaiement ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
