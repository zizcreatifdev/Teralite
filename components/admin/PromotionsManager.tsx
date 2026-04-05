'use client'

import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDateCourte } from '@/lib/utils'
import type { TypePromo } from '@prisma/client'

interface CodePromo {
  id: string
  code: string
  type: TypePromo
  valeur: number
  expiration: string | Date | null
  usageMax: number | null
  usageActuel: number
  actif: boolean
  createdAt: string | Date
}

interface ContenuBanniere {
  banniere_active: string
  banniere_texte: string
  banniere_couleur: string
}

interface Props {
  promos: CodePromo[]
  banniereContenu: ContenuBanniere
}

const TYPE_LABELS: Record<TypePromo, string> = {
  POURCENTAGE: '% Pourcentage',
  MONTANT_FIXE: 'F Montant fixe',
}

export default function PromotionsManager({ promos: initialPromos, banniereContenu }: Props) {
  const [promos, setPromos] = useState<CodePromo[]>(initialPromos)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Form création
  const [code, setCode] = useState('')
  const [type, setType] = useState<TypePromo>('POURCENTAGE')
  const [valeur, setValeur] = useState('')
  const [expiration, setExpiration] = useState('')
  const [usageMax, setUsageMax] = useState('')

  // Bannière
  const [banniereActive, setBanniereActive] = useState(banniereContenu.banniere_active === 'true')
  const [banniereTexte, setBanniereTexte] = useState(banniereContenu.banniere_texte)
  const [banniereCouleur, setBanniereCouleur] = useState(banniereContenu.banniere_couleur || '#FFA000')
  const [savingBanniere, setSavingBanniere] = useState(false)
  const [savedBanniere, setSavedBanniere] = useState(false)

  const creerPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          type,
          valeur: parseFloat(valeur),
          expiration: expiration ? new Date(expiration).toISOString() : null,
          usageMax: usageMax ? parseInt(usageMax) : null,
          actif: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      const created = await res.json() as CodePromo
      setPromos((prev) => [created, ...prev])
      setShowForm(false)
      setCode(''); setValeur(''); setExpiration(''); setUsageMax('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (promo: CodePromo) => {
    await fetch(`/api/admin/promotions/${promo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !promo.actif }),
    })
    setPromos((prev) => prev.map((p) => (p.id === promo.id ? { ...p, actif: !p.actif } : p)))
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    setPromos((prev) => prev.filter((p) => p.id !== id))
  }

  const sauvegarderBanniere = async () => {
    setSavingBanniere(true)
    setSavedBanniere(false)
    try {
      await fetch('/api/admin/contenu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cles: {
            banniere_active: String(banniereActive),
            banniere_texte: banniereTexte,
            banniere_couleur: banniereCouleur,
          },
        }),
      })
      setSavedBanniere(true)
      setTimeout(() => setSavedBanniere(false), 3000)
    } finally {
      setSavingBanniere(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">

      {/* Bannière promotionnelle */}
      <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Bannière promotionnelle (accueil)</h2>
          <div className="flex items-center gap-2">
            {savedBanniere && <span className="text-xs text-green-teralite font-medium">✓ Sauvegardé</span>}
            <button onClick={sauvegarderBanniere} disabled={savingBanniere}
              className="text-sm bg-blue-teralite text-white px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
              {savingBanniere ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => setBanniereActive((v) => !v)}>
            {banniereActive
              ? <ToggleRight className="w-6 h-6 text-green-teralite" />
              : <ToggleLeft className="w-6 h-6 text-text-light" />}
          </button>
          <span className="text-sm text-text-main font-medium">
            {banniereActive ? 'Bannière activée' : 'Bannière désactivée'}
          </span>
        </label>

        {banniereActive && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Texte de la bannière</label>
              <input value={banniereTexte} onChange={(e) => setBanniereTexte(e.target.value)}
                placeholder="🎉 Promotion : -20% sur toutes les lampes solaires ce mois-ci !"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-text-mid">Couleur</label>
              <input type="color" value={banniereCouleur} onChange={(e) => setBanniereCouleur(e.target.value)}
                className="w-8 h-8 rounded border border-border-main cursor-pointer" />
              <span className="text-xs font-mono text-text-light">{banniereCouleur}</span>
            </div>
            {/* Aperçu */}
            <div className="rounded-lg px-4 py-3 text-sm font-medium text-white text-center" style={{ backgroundColor: banniereCouleur }}>
              {banniereTexte || 'Texte de la bannière…'}
            </div>
          </div>
        )}
      </div>

      {/* Codes promo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Codes promo ({promos.length})</h2>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
            <Plus className="w-4 h-4" />Nouveau code
          </button>
        </div>

        {showForm && (
          <form onSubmit={creerPromo} className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-main">Créer un code promo</h3>
            {erreur && <p className="text-xs text-red-teralite bg-red-light px-3 py-2 rounded-lg">{erreur}</p>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Code *</label>
                <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: PROMO20" maxLength={50}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Type *</label>
                <select value={type} onChange={(e) => setType(e.target.value as TypePromo)}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
                  <option value="POURCENTAGE">Pourcentage (%)</option>
                  <option value="MONTANT_FIXE">Montant fixe (F)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Valeur *</label>
                <input required type="number" value={valeur} onChange={(e) => setValeur(e.target.value)}
                  min={0} step={0.5} placeholder={type === 'POURCENTAGE' ? '20' : '5000'}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Usage max</label>
                <input type="number" value={usageMax} onChange={(e) => setUsageMax(e.target.value)}
                  min={1} placeholder="Illimité"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-text-mid mb-1">Expiration</label>
                <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                {saving ? 'Création…' : 'Créer le code'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Valeur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Expiration</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Usages</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {promos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-text-light">Aucun code promo</td></tr>
              ) : (
                promos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-fond/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-teralite">{p.code}</td>
                    <td className="px-4 py-3 text-text-mid text-xs">{TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-main">
                      {p.type === 'POURCENTAGE' ? `${p.valeur}%` : `${p.valeur.toLocaleString('fr-SN')} F`}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-mid">
                      {p.expiration ? formatDateCourte(new Date(p.expiration)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-text-mid">
                      {p.usageActuel}{p.usageMax ? ` / ${p.usageMax}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActif(p)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          p.actif ? 'bg-green-light text-green-teralite' : 'bg-gray-fond text-text-light'
                        }`}>
                        {p.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {p.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => supprimer(p.id)} className="text-text-light hover:text-red-teralite transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
