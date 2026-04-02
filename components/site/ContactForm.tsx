'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', sujet: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error ?? 'Une erreur est survenue.')
      } else {
        setSucces(true)
      }
    } catch {
      setErreur('Impossible d\'envoyer le message. Vérifiez votre connexion.')
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
        <h2 className="text-lg font-semibold text-text-main mb-2">Message envoyé !</h2>
        <p className="text-text-mid text-sm">Notre équipe vous répondra dans les 24 heures.</p>
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
          <input type="text" required value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Moussa Diallo"
            className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
            Téléphone *
          </label>
          <input type="tel" required value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="+221 77 000 00 00"
            className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Email
        </label>
        <input type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@exemple.com (optionnel)"
          className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Sujet *
        </label>
        <input type="text" required value={form.sujet}
          onChange={(e) => setForm({ ...form, sujet: e.target.value })}
          placeholder="Ex: Question sur un produit, partenariat..."
          className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
        />
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
          Message *
        </label>
        <textarea rows={5} required value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Décrivez votre demande..."
          className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors resize-none"
        />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-teralite hover:bg-blue-dark text-white text-sm font-medium py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Envoi...' : 'Envoyer le message'}
      </button>
    </form>
  )
}
