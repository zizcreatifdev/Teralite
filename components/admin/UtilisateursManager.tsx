'use client'

import { useState } from 'react'
import { Plus, X, ToggleLeft, ToggleRight, Shield, User, Eye, EyeOff } from 'lucide-react'
import { formatDateCourte } from '@/lib/utils'
import type { Role } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Utilisateur {
  id: string
  nom: string
  email: string
  role: Role
  actif: boolean
  createdAt: string | Date
  _count: { commissions: number }
}

interface Props {
  utilisateurs: Utilisateur[]
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VENDEUR: 'Vendeur',
}

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-light text-red-teralite',
  ADMIN: 'bg-blue-light text-blue-teralite',
  VENDEUR: 'bg-green-light text-green-teralite',
}

const defaultForm = {
  nom: '',
  email: '',
  role: 'VENDEUR' as 'ADMIN' | 'VENDEUR',
  motDePasse: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UtilisateursManager({ utilisateurs: initialUtilisateurs }: Props) {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initialUtilisateurs)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const creerUtilisateur = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/utilisateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      const created = await res.json() as Utilisateur & { _count: { commissions: number } }
      setUtilisateurs((prev) => [{ ...created, _count: { commissions: 0 } }, ...prev])
      setShowForm(false)
      setForm(defaultForm)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (utilisateur: Utilisateur) => {
    if (utilisateur.role === 'SUPER_ADMIN') return
    const res = await fetch(`/api/admin/utilisateurs/${utilisateur.id}/toggle`, { method: 'PUT' })
    if (res.ok) {
      const updated = await res.json() as Utilisateur
      setUtilisateurs((prev) => prev.map((u) => u.id === utilisateur.id ? { ...u, actif: updated.actif } : u))
    }
  }

  const superAdmins = utilisateurs.filter((u) => u.role === 'SUPER_ADMIN')
  const admins = utilisateurs.filter((u) => u.role === 'ADMIN')
  const vendeurs = utilisateurs.filter((u) => u.role === 'VENDEUR')

  const renderGroupe = (titre: string, liste: Utilisateur[], icon: React.ReactNode) => {
    if (liste.length === 0) return null
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          {icon}
          <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">{titre} ({liste.length})</h3>
        </div>
        <div className="bg-white rounded-xl border border-border-main overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-main bg-gray-fond">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider hidden md:table-cell">Rôle</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider hidden md:table-cell">Commissions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider hidden lg:table-cell">Depuis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {liste.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-fond/50 transition-colors ${!u.actif ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                        u.role === 'SUPER_ADMIN' ? 'bg-red-teralite' : u.role === 'ADMIN' ? 'bg-blue-teralite' : 'bg-green-teralite'
                      }`}>
                        {u.nom.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-text-main">{u.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-mid text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-mid hidden md:table-cell">{u._count.commissions}</td>
                  <td className="px-4 py-3 text-xs text-text-light hidden lg:table-cell">
                    {formatDateCourte(new Date(u.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'SUPER_ADMIN' ? (
                      <span className="flex items-center gap-1 text-xs text-red-teralite font-medium">
                        <Shield className="w-3.5 h-3.5" />Protégé
                      </span>
                    ) : (
                      <button onClick={() => toggleActif(u)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          u.actif ? 'bg-green-light text-green-teralite' : 'bg-gray-fond text-text-light'
                        }`}>
                        {u.actif
                          ? <ToggleRight className="w-3.5 h-3.5" />
                          : <ToggleLeft className="w-3.5 h-3.5" />}
                        {u.actif ? 'Actif' : 'Inactif'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-light">
          {utilisateurs.length} compte{utilisateurs.length > 1 ? 's' : ''} ·{' '}
          {utilisateurs.filter((u) => u.actif).length} actif{utilisateurs.filter((u) => u.actif).length > 1 ? 's' : ''}
        </p>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
          <Plus className="w-4 h-4" />Ajouter un membre
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={creerUtilisateur} className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-main">Nouveau membre de l&apos;équipe</h3>
            <button type="button" onClick={() => { setShowForm(false); setErreur(null) }}>
              <X className="w-4 h-4 text-text-light" />
            </button>
          </div>
          {erreur && <p className="text-xs text-red-teralite bg-red-light px-3 py-2 rounded-lg">{erreur}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Nom complet *</label>
              <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Moussa Diallo"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="moussa@teralite.sn"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Rôle *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'VENDEUR' })}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
                <option value="VENDEUR">Vendeur — accès ventes et ses commissions</option>
                <option value="ADMIN">Admin — accès complet sauf gestion équipe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Mot de passe temporaire *</label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={form.motDePasse}
                  onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                  placeholder="Min. 8 caractères"
                  minLength={8}
                  className="w-full border border-border-main rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-blue-teralite" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
              {saving ? 'Création…' : 'Créer le compte'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setErreur(null) }}
              className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Tableaux par groupe */}
      {renderGroupe('Super Administrateurs', superAdmins, <Shield className="w-3.5 h-3.5 text-red-teralite" />)}
      {renderGroupe('Administrateurs', admins, <User className="w-3.5 h-3.5 text-blue-teralite" />)}
      {renderGroupe('Vendeurs', vendeurs, <User className="w-3.5 h-3.5 text-green-teralite" />)}
    </div>
  )
}
