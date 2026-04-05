'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText, CheckCircle2, Save, RefreshCw } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'
import { STATUT_DEVIS_LABELS } from '@/types/index'
import type { StatutDevis } from '@prisma/client'

interface ProduitOption { id: string; nom: string; reference: string; prixDevis: number | null }

interface LigneDevisItem {
  id?: string
  designation: string
  produitId: string | null
  quantite: number
  prixUnitaire: number
  remise: number
  tva: number
  sousTotal: number
}

interface DevisData {
  id: string
  numero: string
  statut: StatutDevis
  conditions: string | null
  validiteJours: number
  notes: string | null
  createdAt: string | Date
  client: { id: string; nom: string; telephone: string; email: string | null; adresse: string | null }
  lignes: LigneDevisItem[]
  facture: { id: string; numero: string; montantTTC: number } | null
}

const BADGE: Record<StatutDevis, string> = {
  NOUVEAU: 'bg-orange-light text-orange-teralite',
  EN_COURS: 'bg-blue-light text-blue-teralite',
  ENVOYE: 'bg-blue-light text-blue-dark',
  ACCEPTE: 'bg-green-light text-green-teralite',
  REFUSE: 'bg-red-light text-red-teralite',
}

const TRANSITIONS: Record<StatutDevis, StatutDevis[]> = {
  NOUVEAU: ['EN_COURS', 'ENVOYE', 'REFUSE'],
  EN_COURS: ['ENVOYE', 'REFUSE'],
  ENVOYE: ['ACCEPTE', 'REFUSE', 'EN_COURS'],
  ACCEPTE: ['REFUSE'],
  REFUSE: [],
}

function calculerSousTotal(q: number, pu: number, remise: number): number {
  return Math.round(q * pu * (1 - remise / 100))
}

export default function DevisDetailClient({ devis: initial }: { devis: DevisData }) {
  const router = useRouter()
  const [devis, setDevis] = useState(initial)
  const [lignes, setLignes] = useState<LigneDevisItem[]>(initial.lignes)
  const [conditions, setConditions] = useState(initial.conditions ?? '')
  const [validiteJours, setValiditeJours] = useState(String(initial.validiteJours))
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changingStatut, setChangingStatut] = useState<StatutDevis | null>(null)
  const [converting, setConverting] = useState(false)
  const [produits, setProduits] = useState<ProduitOption[]>([])

  useEffect(() => {
    fetch('/api/admin/produits?limit=200')
      .then((r) => r.json())
      .then((d: { produits?: ProduitOption[] }) => setProduits(d.produits ?? []))
      .catch(() => {})
  }, [])

  // ——— Lignes ———
  const ajouterLigne = () =>
    setLignes((prev) => [
      ...prev,
      { designation: '', produitId: null, quantite: 1, prixUnitaire: 0, remise: 0, tva: 0, sousTotal: 0 },
    ])

  const supprimerLigne = (idx: number) => setLignes((prev) => prev.filter((_, i) => i !== idx))

  const updateLigne = (idx: number, champ: keyof LigneDevisItem, val: string | number | null) => {
    setLignes((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l
        const updated = { ...l, [champ]: val }
        // Si on sélectionne un produit, pré-remplir le prix
        if (champ === 'produitId' && typeof val === 'string') {
          const prod = produits.find((p) => p.id === val)
          if (prod) {
            updated.designation = prod.nom
            updated.prixUnitaire = prod.prixDevis ?? 0
          }
        }
        updated.sousTotal = calculerSousTotal(
          Number(updated.quantite),
          Number(updated.prixUnitaire),
          Number(updated.remise)
        )
        return updated
      })
    )
  }

  const montantHT = lignes.reduce((s, l) => s + l.sousTotal, 0)
  const montantTVA = lignes.reduce((s, l) => s + Math.round(l.sousTotal * l.tva), 0)
  const montantTTC = montantHT + montantTVA

  // ——— Sauvegarde ———
  const sauvegarder = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/devis/${devis.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditions: conditions || null,
          validiteJours: parseInt(validiteJours) || 30,
          notes: notes || null,
          lignes: lignes.map((l) => ({
            designation: l.designation,
            produitId: l.produitId || null,
            quantite: Number(l.quantite),
            prixUnitaire: Number(l.prixUnitaire),
            remise: Number(l.remise),
            tva: Number(l.tva),
            sousTotal: l.sousTotal,
          })),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  // ——— Statut ———
  const changerStatut = async (s: StatutDevis) => {
    setChangingStatut(s)
    try {
      const res = await fetch(`/api/admin/devis/${devis.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: s }),
      })
      if (res.ok) {
        setDevis((prev) => ({ ...prev, statut: s }))
        router.refresh()
      }
    } finally {
      setChangingStatut(null)
    }
  }

  // ——— Convertir en facture ———
  const convertir = async () => {
    if (!confirm('Convertir ce devis en facture ? Cette action est irréversible.')) return
    setConverting(true)
    try {
      const res = await fetch(`/api/admin/devis/${devis.id}/convertir`, { method: 'POST' })
      if (res.ok) {
        const facture = await res.json() as { id: string; numero: string; montantTTC: number }
        setDevis((prev) => ({ ...prev, facture }))
        router.refresh()
      }
    } finally {
      setConverting(false)
    }
  }

  const statuts = TRANSITIONS[devis.statut]

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={sauvegarder}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-teralite text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-teralite">
            <CheckCircle2 className="w-4 h-4" />Sauvegardé
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Changement statut */}
          {statuts.length > 0 && (
            <>
              <span className="text-sm text-text-light">→</span>
              {statuts.map((s) => (
                <button
                  key={s}
                  onClick={() => changerStatut(s)}
                  disabled={changingStatut !== null}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    s === 'REFUSE'
                      ? 'border-red-teralite text-red-teralite hover:bg-red-light'
                      : 'border-blue-teralite text-blue-teralite hover:bg-blue-light'
                  }`}
                >
                  {changingStatut === s ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : STATUT_DEVIS_LABELS[s]}
                </button>
              ))}
            </>
          )}

          {/* Générer PDF */}
          <a
            href={`/api/admin/devis/${devis.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm border border-blue-teralite text-blue-teralite px-3 py-1.5 rounded-lg hover:bg-blue-light transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </a>

          {/* Convertir en facture */}
          {devis.statut === 'ACCEPTE' && !devis.facture && (
            <button
              onClick={convertir}
              disabled={converting}
              className="flex items-center gap-2 text-sm border border-green-teralite text-green-teralite px-3 py-1.5 rounded-lg hover:bg-green-light transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {converting ? '…' : 'Convertir en facture'}
            </button>
          )}
          {devis.facture && (
            <span className="flex items-center gap-1.5 text-sm text-green-teralite font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Facture {devis.facture.numero}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Éditeur de lignes */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Lignes du devis</h2>
              <button
                onClick={ajouterLigne}
                className="flex items-center gap-1.5 text-xs text-blue-teralite hover:bg-blue-light px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />Ajouter une ligne
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-main bg-gray-fond">
                    <th className="text-left px-3 py-2 text-xs text-text-light font-semibold">Désignation</th>
                    <th className="text-left px-3 py-2 text-xs text-text-light font-semibold w-32">Produit</th>
                    <th className="text-right px-3 py-2 text-xs text-text-light font-semibold w-16">Qté</th>
                    <th className="text-right px-3 py-2 text-xs text-text-light font-semibold w-24">P.U. HT</th>
                    <th className="text-right px-3 py-2 text-xs text-text-light font-semibold w-16">Remise%</th>
                    <th className="text-right px-3 py-2 text-xs text-text-light font-semibold w-16">TVA%</th>
                    <th className="text-right px-3 py-2 text-xs text-text-light font-semibold w-24">S/T HT</th>
                    <th className="w-8 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {lignes.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-text-light text-sm">Aucune ligne — cliquez sur Ajouter</td></tr>
                  ) : (
                    lignes.map((l, idx) => (
                      <tr key={idx} className="group">
                        <td className="px-3 py-2">
                          <input
                            value={l.designation}
                            onChange={(e) => updateLigne(idx, 'designation', e.target.value)}
                            placeholder="Désignation"
                            className="w-full text-sm border-0 bg-transparent focus:outline-none focus:bg-blue-light/30 rounded px-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={l.produitId ?? ''}
                            onChange={(e) => updateLigne(idx, 'produitId', e.target.value || null)}
                            className="w-full text-xs border border-border-main rounded px-1 py-1 focus:outline-none focus:border-blue-teralite"
                          >
                            <option value="">—</option>
                            {produits.map((p) => (
                              <option key={p.id} value={p.id}>{p.reference}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={l.quantite}
                            onChange={(e) => updateLigne(idx, 'quantite', parseInt(e.target.value) || 1)}
                            min={1}
                            className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={l.prixUnitaire}
                            onChange={(e) => updateLigne(idx, 'prixUnitaire', parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={l.remise}
                            onChange={(e) => updateLigne(idx, 'remise', parseFloat(e.target.value) || 0)}
                            min={0} max={100} step={0.5}
                            className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={l.tva * 100}
                            onChange={(e) => updateLigne(idx, 'tva', (parseFloat(e.target.value) || 0) / 100)}
                            min={0} max={100} step={1}
                            className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-text-main text-sm">
                          {l.sousTotal.toLocaleString('fr-SN')} F
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => supprimerLigne(idx)}
                            className="opacity-0 group-hover:opacity-100 text-text-light hover:text-red-teralite transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            {lignes.length > 0 && (
              <div className="border-t border-border-main px-5 py-4">
                <div className="ml-auto w-64 space-y-1.5">
                  <div className="flex justify-between text-sm text-text-mid">
                    <span>Total HT</span><span>{formatFCFA(montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-mid">
                    <span>TVA</span><span>{formatFCFA(montantTVA)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-text-main border-t border-border-main pt-1.5">
                    <span>Total TTC</span><span>{formatFCFA(montantTTC)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditions & notes */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-main">Conditions & notes</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Validité (jours)</label>
                <input
                  type="number"
                  value={validiteJours}
                  onChange={(e) => setValiditeJours(e.target.value)}
                  min={1} max={365}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Conditions générales</label>
              <textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={3}
                placeholder="Conditions de paiement, livraison, garantie…"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Notes internes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes visibles uniquement par l'équipe admin…"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none"
              />
            </div>
          </div>
        </div>

        {/* Colonne secondaire */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Statut</h2>
            <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${BADGE[devis.statut]}`}>
              {STATUT_DEVIS_LABELS[devis.statut]}
            </span>
            <p className="text-xs text-text-light">N° : <span className="font-mono font-semibold text-text-main">{devis.numero}</span></p>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-2">
            <h2 className="text-sm font-semibold text-text-main">Client</h2>
            <p className="font-medium text-text-main">{devis.client.nom}</p>
            <p className="text-sm text-text-mid">{devis.client.telephone}</p>
            {devis.client.email && <p className="text-sm text-text-mid">{devis.client.email}</p>}
            {devis.client.adresse && <p className="text-sm text-text-light">{devis.client.adresse}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
