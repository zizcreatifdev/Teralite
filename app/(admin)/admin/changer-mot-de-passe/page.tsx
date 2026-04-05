'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function ChangerMotDePassePage() {
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showNouveau, setShowNouveau] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (nouveau.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (nouveau !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/utilisateurs/changer-mot-de-passe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nouveauMotDePasse: nouveau }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur lors du changement de mot de passe.')
        return
      }

      // Invalider le token JWT (contient encore premiereConnexion=true) → forcer reconnexion
      await signOut({ callbackUrl: '/admin/login?changed=true' })
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-teralite flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Icône + titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-7 h-7 text-blue-teralite" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Sécurisez votre compte</h1>
          <p className="text-white/70 text-sm mt-2 leading-relaxed">
            Première connexion détectée.<br />
            Choisissez un mot de passe personnel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-light border border-red-teralite/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-teralite mt-1.5 flex-shrink-0" />
              <p className="text-sm text-red-teralite">{error}</p>
            </div>
          )}

          {/* Nouveau mot de passe */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNouveau ? 'text' : 'password'}
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                className="w-full border border-border-main rounded-lg px-3 py-2.5 pr-10 text-sm text-text-main
                           focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                           placeholder:text-text-light transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNouveau(!showNouveau)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-mid transition-colors"
              >
                {showNouveau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmation ? 'text' : 'password'}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-border-main rounded-lg px-3 py-2.5 pr-10 text-sm text-text-main
                           focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                           placeholder:text-text-light transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation(!showConfirmation)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-mid transition-colors"
              >
                {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-teralite hover:bg-blue-dark text-white text-sm font-medium py-2.5 rounded-lg
                       transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
          </button>

          <p className="text-xs text-text-light text-center mt-4">
            Vous serez redirigé vers la page de connexion.
          </p>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} Teralite — La lumière qui pense pour vous
        </p>
      </div>
    </div>
  )
}
