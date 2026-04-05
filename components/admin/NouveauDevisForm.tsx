'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

interface ClientOption { id: string; nom: string; telephone: string }
interface ProduitOption { id: string; nom: string; reference: string; prixDevis: number | null }

interface Ligne {
  designation: string
  produitId: string | null
  quantite: number
  prixUnitaire: number
  remise: number
  tva: number
  sousTotal: number
}

function calcSousTotal(q: number, pu: number, remise: number) {
  return Math.round(q * pu * (1 - remise / 100))
}

export default function NouveauDevisForm({
  clients,
  produits,
}: {
  clients: ClientOption[]
  produits: ProduitOption[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Client
  const [clientMode, setClientMode] = useState<'existant' | 'nouveau'>('existant')
  const [clientId, setClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [newNom, setNewNom] = useState('')
  const [newTel, setNewTel] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAdresse, setNewAdresse] = useState('')
  const [newType, setNewType] = useState<'PARTICULIER' | 'ENTREPRISE' | 'MUNICIPALITE'>('PARTICULIER')

  // Lignes
  const [lignes, setLignes] = useState<Ligne[]>([
    { designation: '', produitId: null, quantite: 1, prixUnitaire: 0, remise: 0, tva: 0, sousTotal: 0 },
  ])

  // Options
  const [conditions, setConditions] = useState('')
  const [validiteJours, setValiditeJours] = useState('30')
  const [notes, setNotes] = useState('')

  const clientsFiltres = clientSearch
    ? clients.filter(
        (c) =>
          c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.telephone.includes(clientSearch)
      )
    : clients.slice(0, 20)

  const ajouterLigne = () =>
    setLignes((prev) => [
      ...prev,
      { designation: '', produitId: null, quantite: 1, prixUnitaire: 0, remise: 0, tva: 0, sousTotal: 0 },
    ])

  const supprimerLigne = (idx: number) => setLignes((prev) => prev.filter((_, i) => i !== idx))

  const updateLigne = (idx: number, champ: keyof Ligne, val: string | number | null) => {
    setLignes((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l
        const updated = { ...l, [champ]: val }
        if (champ === 'produitId' && typeof val === 'string' && val) {
          const p = produits.find((p) => p.id === val)
          if (p) { updated.designation = p.nom; updated.prixUnitaire = p.prixDevis ?? 0 }
        }
        updated.sousTotal = calcSousTotal(Number(updated.quantite), Number(updated.prixUnitaire), Number(updated.remise))
        return updated
      })
    )
  }

  const montantHT = lignes.reduce((s, l) => s + l.sousTotal, 0)
  const montantTVA = lignes.reduce((s, l) => s + Math.round(l.sousTotal * l.tva), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)

    if (clientMode === 'existant' && !clientId)
      return setErreur('Veuillez sélectionner un client.')
    if (lignes.some((l) => !l.designation))
      return setErreur('Toutes les lignes doivent avoir une désignation.')

    setSaving(true)
    try {
      const payload = {
        ...(clientMode === 'existant' ? { clientId } : {
          newClient: { nom: newNom, telephone: newTel, email: newEmail || null, adresse: newAdresse || null, type: newType },
        }),
        lignes: lignes.map((l) => ({
          designation: l.designation,
          produitId: l.produitId || null,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
          remise: Number(l.remise),
          tva: Number(l.tva),
          sousTotal: l.sousTotal,
        })),
        conditions: conditions || null,
        validiteJours: parseInt(validiteJours) || 30,
        notes: notes || null,
      }

      const res = await fetch('/api/admin/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }

      const created = await res.json() as { id: string }
      router.push(`/admin/devis/${created.id}`)
      router.refresh()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {erreur && (
        <div className="bg-red-light border border-red-teralite/30 text-red-teralite text-sm rounded-xl px-4 py-3">
          {erreur}
        </div>
      )}

      {/* Section client */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-main">Client</h2>
        <div className="flex gap-3">
          {(['existant', 'nouveau'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setClientMode(m)}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                clientMode === m
                  ? 'bg-blue-teralite text-white border-blue-teralite'
                  : 'text-text-mid border-border-main hover:bg-gray-fond'
              }`}
            >
              {m === 'existant' ? 'Client existant' : 'Nouveau client'}
            </button>
          ))}
        </div>

        {clientMode === 'existant' ? (
          <div className="space-y-2">
            <input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Rechercher par nom ou téléphone…"
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            />
            <div className="max-h-48 overflow-y-auto border border-border-main rounded-lg divide-y divide-border-main">
              {clientsFiltres.length === 0 ? (
                <p className="px-3 py-3 text-sm text-text-light">Aucun client trouvé</p>
              ) : (
                clientsFiltres.map((c) => (
                  <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-fond ${clientId === c.id ? 'bg-blue-light' : ''}`}>
                    <input
                      type="radio"
                      name="clientId"
                      value={c.id}
                      checked={clientId === c.id}
                      onChange={() => setClientId(c.id)}
                      className="accent-blue-teralite"
                    />
                    <span className="text-sm font-medium text-text-main">{c.nom}</span>
                    <span className="text-xs text-text-light ml-auto">{c.telephone}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Nom *</label>
              <input required value={newNom} onChange={(e) => setNewNom(e.target.value)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Téléphone *</label>
              <input required value={newTel} onChange={(e) => setNewTel(e.target.value)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as typeof newType)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
                <option value="PARTICULIER">Particulier</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="MUNICIPALITE">Municipalité</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-mid mb-1">Adresse</label>
              <input value={newAdresse} onChange={(e) => setNewAdresse(e.target.value)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
          </div>
        )}
      </div>

      {/* Lignes */}
      <div className="bg-white rounded-xl border border-border-main overflow-hidden">
        <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Lignes</h2>
          <button type="button" onClick={ajouterLigne}
            className="flex items-center gap-1.5 text-xs text-blue-teralite hover:bg-blue-light px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />Ajouter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond text-xs text-text-light font-semibold">
                <th className="text-left px-3 py-2">Désignation</th>
                <th className="text-left px-3 py-2 w-32">Produit</th>
                <th className="text-right px-3 py-2 w-16">Qté</th>
                <th className="text-right px-3 py-2 w-28">P.U. HT (F)</th>
                <th className="text-right px-3 py-2 w-16">Remise%</th>
                <th className="text-right px-3 py-2 w-16">TVA%</th>
                <th className="text-right px-3 py-2 w-24">S/T HT</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {lignes.map((l, idx) => (
                <tr key={idx} className="group">
                  <td className="px-3 py-2">
                    <input value={l.designation} onChange={(e) => updateLigne(idx, 'designation', e.target.value)}
                      placeholder="Désignation" className="w-full text-sm border border-border-main rounded px-2 py-1 focus:outline-none focus:border-blue-teralite" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={l.produitId ?? ''} onChange={(e) => updateLigne(idx, 'produitId', e.target.value || null)}
                      className="w-full text-xs border border-border-main rounded px-1 py-1 focus:outline-none focus:border-blue-teralite">
                      <option value="">—</option>
                      {produits.map((p) => <option key={p.id} value={p.id}>{p.reference}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={l.quantite} min={1}
                      onChange={(e) => updateLigne(idx, 'quantite', parseInt(e.target.value) || 1)}
                      className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={l.prixUnitaire} min={0}
                      onChange={(e) => updateLigne(idx, 'prixUnitaire', parseInt(e.target.value) || 0)}
                      className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={l.remise} min={0} max={100} step={0.5}
                      onChange={(e) => updateLigne(idx, 'remise', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={l.tva * 100} min={0} max={100} step={1}
                      onChange={(e) => updateLigne(idx, 'tva', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-full text-sm text-right border border-border-main rounded px-1 py-0.5 focus:outline-none focus:border-blue-teralite" />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-text-main text-sm">
                    {l.sousTotal.toLocaleString('fr-SN')} F
                  </td>
                  <td className="px-3 py-2">
                    {lignes.length > 1 && (
                      <button type="button" onClick={() => supprimerLigne(idx)}
                        className="text-text-light hover:text-red-teralite transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totaux */}
        <div className="border-t border-border-main px-5 py-3">
          <div className="ml-auto w-56 space-y-1">
            <div className="flex justify-between text-sm text-text-mid">
              <span>Total HT</span><span>{formatFCFA(montantHT)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-mid">
              <span>TVA</span><span>{formatFCFA(montantTVA)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-text-main border-t border-border-main pt-1.5">
              <span>Total TTC</span><span>{formatFCFA(montantHT + montantTVA)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-main">Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Validité (jours)</label>
            <input type="number" value={validiteJours} min={1} max={365}
              onChange={(e) => setValiditeJours(e.target.value)}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-mid mb-1">Conditions</label>
          <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2}
            placeholder="Conditions de paiement, livraison…"
            className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-mid mb-1">Notes internes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
        </div>
      </div>

      <div className="flex items-center gap-3 pb-8">
        <button type="submit" disabled={saving}
          className="bg-blue-teralite text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
          {saving ? 'Création…' : 'Créer le devis'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm text-text-mid border border-border-main px-5 py-2.5 rounded-lg hover:bg-gray-fond transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}
