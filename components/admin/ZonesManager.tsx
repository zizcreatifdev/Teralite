'use client'

import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit2, X, Check } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

interface Zone {
  id: string
  nom: string
  tarif: number
  delaiJours: number
  actif: boolean
  _count?: { commandes: number }
}

interface Props {
  zones: Zone[]
}

const defaultForm = { nom: '', tarif: '', delaiJours: '2' }

export default function ZonesManager({ zones: initialZones }: Props) {
  const [zones, setZones] = useState<Zone[]>(initialZones)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ nom: string; tarif: string; delaiJours: string }>({ nom: '', tarif: '', delaiJours: '' })

  const creer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          tarif: parseInt(form.tarif),
          delaiJours: parseInt(form.delaiJours),
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      const created = await res.json() as Zone
      setZones((prev) => [...prev, { ...created, _count: { commandes: 0 } }])
      setShowForm(false)
      setForm(defaultForm)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (zone: Zone) => {
    setEditingId(zone.id)
    setEditForm({ nom: zone.nom, tarif: String(zone.tarif), delaiJours: String(zone.delaiJours) })
  }

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/admin/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: editForm.nom,
        tarif: parseInt(editForm.tarif),
        delaiJours: parseInt(editForm.delaiJours),
      }),
    })
    if (res.ok) {
      const updated = await res.json() as Zone
      setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updated } : z)))
      setEditingId(null)
    }
  }

  const toggleActif = async (zone: Zone) => {
    const res = await fetch(`/api/admin/zones/${zone.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !zone.actif }),
    })
    if (res.ok) {
      setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, actif: !z.actif } : z)))
    }
  }

  const supprimer = async (zone: Zone) => {
    const nbCmd = zone._count?.commandes ?? 0
    if (nbCmd > 0) {
      alert(`Cette zone est liée à ${nbCmd} commande${nbCmd > 1 ? 's' : ''}. Désactivez-la plutôt que de la supprimer.`)
      return
    }
    if (!confirm('Supprimer cette zone de livraison ?')) return
    const res = await fetch(`/api/admin/zones/${zone.id}`, { method: 'DELETE' })
    if (res.ok) {
      setZones((prev) => prev.filter((z) => z.id !== zone.id))
    } else {
      const d = await res.json() as { error?: string }
      alert(d.error ?? 'Impossible de supprimer cette zone.')
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-light mt-0.5">
              {zones.length} zone{zones.length > 1 ? 's' : ''} · cliquez sur une ligne pour modifier
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
            <Plus className="w-4 h-4" />Nouvelle zone
          </button>
        </div>

        {showForm && (
          <form onSubmit={creer} className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-main">Créer une zone de livraison</h3>
            {erreur && <p className="text-xs text-red-teralite bg-red-light px-3 py-2 rounded-lg">{erreur}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Nom *</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="ex: Dakar Centre"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Tarif (F CFA) *</label>
                <input required type="number" min={0} value={form.tarif} onChange={(e) => setForm({ ...form, tarif: e.target.value })}
                  placeholder="2500"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Délai (jours) *</label>
                <input required type="number" min={1} value={form.delaiJours} onChange={(e) => setForm({ ...form, delaiJours: e.target.value })}
                  placeholder="2"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                {saving ? 'Création…' : 'Créer la zone'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setErreur(null) }}
                className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Zone</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Tarif</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Délai</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Commandes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {zones.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-text-light">Aucune zone de livraison</td></tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-fond/50 transition-colors">
                    <td className="px-4 py-3">
                      {editingId === zone.id ? (
                        <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                          className="border border-blue-teralite rounded-lg px-2 py-1 text-sm w-40 focus:outline-none" />
                      ) : (
                        <span className="font-medium text-text-main">{zone.nom}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-main">
                      {editingId === zone.id ? (
                        <input type="number" min={0} value={editForm.tarif} onChange={(e) => setEditForm({ ...editForm, tarif: e.target.value })}
                          className="border border-blue-teralite rounded-lg px-2 py-1 text-sm w-28 text-right focus:outline-none" />
                      ) : (
                        formatFCFA(zone.tarif)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-text-mid">
                      {editingId === zone.id ? (
                        <input type="number" min={1} value={editForm.delaiJours} onChange={(e) => setEditForm({ ...editForm, delaiJours: e.target.value })}
                          className="border border-blue-teralite rounded-lg px-2 py-1 text-sm w-16 text-right focus:outline-none" />
                      ) : (
                        `${zone.delaiJours}j`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-text-mid">
                      {zone._count?.commandes ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActif(zone)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          zone.actif ? 'bg-green-light text-green-teralite' : 'bg-gray-fond text-text-light'
                        }`}>
                        {zone.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {zone.actif ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {editingId === zone.id ? (
                          <>
                            <button onClick={() => saveEdit(zone.id)} className="text-green-teralite hover:text-green-teralite/80 transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-text-light hover:text-text-mid transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(zone)} className="text-text-light hover:text-blue-teralite transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => supprimer(zone)} className="text-text-light hover:text-red-teralite transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
