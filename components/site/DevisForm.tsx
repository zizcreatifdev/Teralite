'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface DevisFormProps {
  produitPreselectionne?: string
}

export default function DevisForm({ produitPreselectionne }: DevisFormProps) {
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    besoin: produitPreselectionne ? 'Autre' : '',
    message: produitPreselectionne ? `Bonjour, je suis intéressé(e) par : ${produitPreselectionne}` : '',
  })
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState<string | null>(null)
  const [erreur, setErreur] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error ?? 'Une erreur est survenue.')
      } else {
        setSucces(data.numero)
      }
    } catch {
      setErreur('Impossible d\'envoyer la demande. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  if (succes) {
    return (
      <div className="bg-white rounded-xl border border-green-teralite/30 p-10 text-center">
        <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-teralite" />
        </div>
        <h2 className="text-xl font-semibold text-text-main mb-2">
          Demande envoyée !
        </h2>
        <p className="text-text-mid text-sm mb-1">
          Votre demande de devis <strong className="font-mono">{succes}</strong> a bien été reçue.
        </p>
        <p className="text-text-mid text-sm mb-6">
          Notre équipe vous contactera dans les 24 heures.
        </p>
        <Link
          href="/produits"
          className="inline-block bg-blue-teralite text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-dark transition-colors"
        >
          Continuer à parcourir nos produits
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border-main p-6 md:p-8">
      {erreur && (
        <div className="bg-red-light border border-red-teralite/30 rounded-xl px-4 py-3 mb-5 text-sm text-red-teralite">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
            Nom complet *
          </label>
          <input
            type="text"
            required
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Moussa Diallo"
            className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                       focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                       placeholder:text-text-light transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
            Téléphone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="+221 77 000 00 00"
            className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                       focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                       placeholder:text-text-light transition-colors"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Type de besoin *
        </label>
        <select
          required
          value={form.besoin}
          onChange={(e) => setForm({ ...form, besoin: e.target.value })}
          className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                     focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                     transition-colors"
        >
          <option value="">Sélectionnez votre besoin</option>
          <option value="Éclairage domestique">Éclairage domestique</option>
          <option value="Éclairage commercial">Éclairage commercial / bureau</option>
          <option value="Éclairage industriel">Éclairage industriel / entrepôt</option>
          <option value="Éclairage solaire">Éclairage solaire / autonome</option>
          <option value="Projet municipal">Projet municipal / voirie</option>
          <option value="Autre">Autre / produit spécifique</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Description du projet
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Décrivez votre projet : surface à éclairer, nombre de points lumineux, contraintes particulières, délai souhaité..."
          className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                     focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                     placeholder:text-text-light transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-teralite hover:bg-orange-dark text-white text-sm font-medium py-3 rounded-lg
                   transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
      </button>
      <p className="text-xs text-text-light text-center mt-3">
        Gratuit · Sans engagement · Réponse sous 24h
      </p>
    </form>
  )
}
