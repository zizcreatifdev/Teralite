'use client'

import { useState, useCallback, useEffect } from 'react'
import { Settings, Check, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import type { StatutCommission } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfigCommission {
  id: string
  taux: number | null
  montantFixe: number | null
  actif: boolean
  dateEffet: string | Date
}

interface VendeurResume {
  vendeur: { id: string; nom: string; email: string }
  nbVentes: number
  caGenere: number
  commissionTotale: number
  statuts: { EN_ATTENTE: number; VALIDEE: number; PAYEE: number; ANNULEE: number }
  commissions: CommissionItem[]
}

interface CommissionItem {
  id: string
  montant: number
  statut: StatutCommission
  taux: number | null
  montantFixe: number | null
  notePaiement: string | null
  payeeLe: string | Date | null
  createdAt: string | Date
  vendeur: { id: string; nom: string; email: string }
  commande: { numero: string; montantTotal: number; createdAt: string | Date }
}

interface Props {
  configActuelle: ConfigCommission | null
  vendeurs: { id: string; nom: string; email: string; role: string }[]
  initialCommissions: CommissionItem[]
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

export default function CommissionsAdmin({
  configActuelle: initialConfig,
  vendeurs,
  initialCommissions,
  periodeInitiale,
}: Props) {
  const [config, setConfig] = useState(initialConfig)
  const [annee, setAnnee] = useState(periodeInitiale.annee)
  const [mois, setMois] = useState(periodeInitiale.mois)
  const [filtreVendeur, setFiltreVendeur] = useState('')
  const [resumeVendeurs, setResumeVendeurs] = useState<VendeurResume[]>([])
  const [loadingResume, setLoadingResume] = useState(false)
  const [expandedVendeur, setExpandedVendeur] = useState<string | null>(null)

  // Config modal
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [formTaux, setFormTaux] = useState(String(initialConfig?.taux ?? ''))
  const [formMontantFixe, setFormMontantFixe] = useState(String(initialConfig?.montantFixe ?? ''))
  const [formDateEffet, setFormDateEffet] = useState(new Date().toISOString().slice(0, 10))
  const [savingConfig, setSavingConfig] = useState(false)
  const [erreurConfig, setErreurConfig] = useState<string | null>(null)

  // Modal paiement
  const [modalPaiement, setModalPaiement] = useState<{ vendeur: VendeurResume; commissionId: string; montantActuel: number } | null>(null)
  const [formMontantPaiement, setFormMontantPaiement] = useState('')
  const [formNotePaiement, setFormNotePaiement] = useState('')
  const [savingPaiement, setSavingPaiement] = useState(false)

  const chargerResume = useCallback(async () => {
    setLoadingResume(true)
    try {
      const p = new URLSearchParams({ annee: String(annee), mois: String(mois) })
      if (filtreVendeur) p.set('vendeurId', filtreVendeur)
      const res = await fetch(`/api/admin/commissions?${p.toString()}`)
      if (res.ok) {
        const d = await res.json() as { vendeurs: VendeurResume[] }
        setResumeVendeurs(d.vendeurs)
      }
    } finally {
      setLoadingResume(false)
    }
  }, [annee, mois, filtreVendeur])

  // Initialise avec les données serveur
  useEffect(() => {
    if (initialCommissions.length > 0) {
      // Regrouper les commissions initiales par vendeur
      const map: Record<string, VendeurResume> = {}
      for (const c of initialCommissions) {
        const vid = c.vendeur.id
        if (!map[vid]) {
          map[vid] = {
            vendeur: c.vendeur,
            nbVentes: 0,
            caGenere: 0,
            commissionTotale: 0,
            statuts: { EN_ATTENTE: 0, VALIDEE: 0, PAYEE: 0, ANNULEE: 0 },
            commissions: [],
          }
        }
        map[vid].nbVentes++
        map[vid].caGenere += c.commande.montantTotal
        if (c.statut !== 'ANNULEE') map[vid].commissionTotale += c.montant
        map[vid].statuts[c.statut]++
        map[vid].commissions.push(c)
      }
      setResumeVendeurs(Object.values(map))
    }
  }, [initialCommissions])

  useEffect(() => { chargerResume() }, [annee, mois, filtreVendeur, chargerResume])

  const sauvegarderConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreurConfig(null)
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/commissions/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taux: formTaux ? parseFloat(formTaux) : null,
          montantFixe: formMontantFixe ? parseInt(formMontantFixe) : null,
          dateEffet: new Date(formDateEffet).toISOString(),
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      const newConfig = await res.json() as ConfigCommission
      setConfig(newConfig)
      setShowConfigForm(false)
    } catch (err) {
      setErreurConfig(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSavingConfig(false)
    }
  }

  const ouvrirModalPaiement = (vendeur: VendeurResume) => {
    // Trouve la première commission EN_ATTENTE pour ce vendeur dans la période
    const premiere = vendeur.commissions.find((c) => c.statut === 'EN_ATTENTE' || c.statut === 'VALIDEE')
    if (!premiere) return
    setModalPaiement({ vendeur, commissionId: premiere.id, montantActuel: vendeur.commissionTotale })
    setFormMontantPaiement(String(vendeur.commissionTotale))
    setFormNotePaiement('')
  }

  const payerCommission = async () => {
    if (!modalPaiement) return
    setSavingPaiement(true)
    try {
      // Payer toutes les commissions EN_ATTENTE/VALIDEE du vendeur sur la période
      const aPayerIds = modalPaiement.vendeur.commissions
        .filter((c) => c.statut === 'EN_ATTENTE' || c.statut === 'VALIDEE')
        .map((c) => c.id)

      // Payer la première avec le montant ajusté (les autres avec leur montant)
      await Promise.all(
        aPayerIds.map((id, i) =>
          fetch(`/api/admin/commissions/${id}/payer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              montant: i === 0 ? parseInt(formMontantPaiement) : undefined,
              note: formNotePaiement || undefined,
            }),
          })
        )
      )

      setModalPaiement(null)
      await chargerResume()
    } finally {
      setSavingPaiement(false)
    }
  }

  const totalDu = resumeVendeurs.reduce((s, v) => s + v.commissionTotale, 0)
  const totalPaye = resumeVendeurs.reduce((s, v) =>
    s + v.commissions.filter(c => c.statut === 'PAYEE').reduce((a, c) => a + c.montant, 0), 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

      {/* ── Configuration taux ── */}
      <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Configuration des commissions</h2>
          <button onClick={() => setShowConfigForm((v) => !v)}
            className="flex items-center gap-2 text-sm border border-border-main px-3 py-1.5 rounded-lg hover:bg-gray-fond transition-colors text-text-mid">
            <Settings className="w-4 h-4" />Modifier
          </button>
        </div>

        {config ? (
          <div className="flex flex-wrap gap-4">
            {config.taux != null && (
              <div className="bg-blue-light rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-text-light uppercase mb-1">Taux</p>
                <p className="text-xl font-semibold text-blue-teralite">{config.taux}%</p>
              </div>
            )}
            {config.montantFixe != null && (
              <div className="bg-orange-light rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-text-light uppercase mb-1">Montant fixe</p>
                <p className="text-xl font-semibold text-orange-teralite">{formatFCFA(config.montantFixe)}</p>
              </div>
            )}
            <div className="bg-gray-fond rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-text-light uppercase mb-1">En vigueur depuis</p>
              <p className="text-sm font-medium text-text-main">{formatDateCourte(new Date(config.dateEffet))}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-teralite text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Aucune configuration de commission définie</span>
          </div>
        )}

        {showConfigForm && (
          <form onSubmit={sauvegarderConfig} className="border-t border-border-main pt-4 space-y-3">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">Nouvelle configuration</h3>
            {erreurConfig && (
              <p className="text-xs text-red-teralite bg-red-light px-3 py-2 rounded-lg">{erreurConfig}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Taux (%)</label>
                <input type="number" min={0} max={100} step={0.1} value={formTaux}
                  onChange={(e) => setFormTaux(e.target.value)}
                  placeholder="5"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Montant fixe (F CFA)</label>
                <input type="number" min={0} value={formMontantFixe}
                  onChange={(e) => setFormMontantFixe(e.target.value)}
                  placeholder="2500"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Date d&apos;effet *</label>
                <input required type="date" value={formDateEffet}
                  onChange={(e) => setFormDateEffet(e.target.value)}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            </div>
            <p className="text-xs text-text-light">
              Laissez vide le champ non utilisé. Les deux peuvent être combinés (taux + montant fixe).
            </p>
            <div className="flex gap-2">
              <button type="submit" disabled={savingConfig}
                className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                {savingConfig ? 'Enregistrement…' : 'Appliquer'}
              </button>
              <button type="button" onClick={() => setShowConfigForm(false)}
                className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Sélecteur période + totaux ── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <select value={mois} onChange={(e) => setMois(parseInt(e.target.value))}
            className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
            {MOIS_LABELS.map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
          <input type="number" min={2020} max={2099} value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="border border-border-main rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-blue-teralite" />
          <select value={filtreVendeur} onChange={(e) => setFiltreVendeur(e.target.value)}
            className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
            <option value="">Tous les vendeurs</option>
            {vendeurs.map((v) => (
              <option key={v.id} value={v.id}>{v.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-light text-orange-teralite text-sm font-semibold px-4 py-2 rounded-lg">
            À payer : {formatFCFA(totalDu - totalPaye)}
          </div>
          <div className="bg-green-light text-green-teralite text-sm font-semibold px-4 py-2 rounded-lg">
            Payé : {formatFCFA(totalPaye)}
          </div>
        </div>
      </div>

      {/* ── Récapitulatif par vendeur ── */}
      <div className="space-y-3">
        {loadingResume && (
          <div className="text-center py-8 text-text-light text-sm">Chargement…</div>
        )}
        {!loadingResume && resumeVendeurs.length === 0 && (
          <div className="bg-white rounded-xl border border-border-main px-5 py-10 text-center text-text-light text-sm">
            Aucune commission sur cette période
          </div>
        )}
        {resumeVendeurs.map((vr) => {
          const aPayerMontant = vr.commissions
            .filter((c) => c.statut === 'EN_ATTENTE' || c.statut === 'VALIDEE')
            .reduce((s, c) => s + c.montant, 0)
          const isExpanded = expandedVendeur === vr.vendeur.id

          return (
            <div key={vr.vendeur.id} className="bg-white rounded-xl border border-border-main overflow-hidden">
              {/* En-tête vendeur */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-blue-teralite text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {vr.vendeur.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-main text-sm">{vr.vendeur.nom}</p>
                  <p className="text-xs text-text-light">{vr.vendeur.email}</p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-center">
                  <div>
                    <p className="text-xs text-text-light mb-0.5">Ventes</p>
                    <p className="font-semibold text-text-main">{vr.nbVentes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-light mb-0.5">CA généré</p>
                    <p className="font-semibold text-blue-teralite">{formatFCFA(vr.caGenere)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-light mb-0.5">Commission</p>
                    <p className="font-semibold text-text-main">{formatFCFA(vr.commissionTotale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-light mb-0.5">Statut</p>
                    <div className="flex gap-1">
                      {vr.statuts.EN_ATTENTE > 0 && (
                        <span className="text-xs bg-orange-light text-orange-teralite px-1.5 py-0.5 rounded-full font-medium">
                          {vr.statuts.EN_ATTENTE} att.
                        </span>
                      )}
                      {vr.statuts.PAYEE > 0 && (
                        <span className="text-xs bg-green-light text-green-teralite px-1.5 py-0.5 rounded-full font-medium">
                          {vr.statuts.PAYEE} payée{vr.statuts.PAYEE > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {aPayerMontant > 0 && (
                    <button onClick={() => ouvrirModalPaiement(vr)}
                      className="flex items-center gap-1.5 bg-green-teralite text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-teralite/80 transition-colors">
                      <Check className="w-3.5 h-3.5" />Payer {formatFCFA(aPayerMontant)}
                    </button>
                  )}
                  <button onClick={() => setExpandedVendeur(isExpanded ? null : vr.vendeur.id)}
                    className="text-text-light hover:text-text-main transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Détail commissions */}
              {isExpanded && (
                <div className="border-t border-border-main">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-fond">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">Commande</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">CA</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">Commission</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-light uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                      {vr.commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-fond/50">
                          <td className="px-4 py-2.5 font-mono font-semibold text-blue-teralite text-xs">{c.commande.numero}</td>
                          <td className="px-4 py-2.5 text-xs text-text-mid">{formatDateCourte(new Date(c.commande.createdAt))}</td>
                          <td className="px-4 py-2.5 text-right text-text-mid text-xs">{formatFCFA(c.commande.montantTotal)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-text-main">{formatFCFA(c.montant)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_BADGE[c.statut]}`}>
                              {STATUT_LABELS[c.statut]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-text-light">{c.notePaiement ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Modal paiement ── */}
      {modalPaiement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-main">
                Confirmer le paiement
              </h3>
              <button onClick={() => setModalPaiement(null)}><X className="w-5 h-5 text-text-light" /></button>
            </div>

            <p className="text-sm text-text-mid">
              Paiement à <span className="font-semibold text-text-main">{modalPaiement.vendeur.vendeur.nom}</span> pour{' '}
              <span className="font-semibold">{MOIS_LABELS[mois - 1]} {annee}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Montant payé (F CFA)</label>
                <input type="number" min={1} value={formMontantPaiement}
                  onChange={(e) => setFormMontantPaiement(e.target.value)}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                <p className="text-xs text-text-light mt-1">
                  Modifiable si ajustement nécessaire (calculé : {formatFCFA(modalPaiement.montantActuel)})
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Note de paiement</label>
                <input type="text" value={formNotePaiement}
                  onChange={(e) => setFormNotePaiement(e.target.value)}
                  placeholder="ex: Payé via Wave le 30/04"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={payerCommission} disabled={savingPaiement || !formMontantPaiement}
                className="flex-1 bg-green-teralite text-white text-sm py-2.5 rounded-lg hover:bg-green-teralite/80 transition-colors disabled:opacity-60 font-medium">
                {savingPaiement ? 'Enregistrement…' : 'Confirmer le paiement'}
              </button>
              <button onClick={() => setModalPaiement(null)}
                className="flex-1 border border-border-main text-text-mid text-sm py-2.5 rounded-lg hover:bg-gray-fond">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
