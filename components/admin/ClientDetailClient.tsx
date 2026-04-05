'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle2 } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import { STATUT_COMMANDE_LABELS, STATUT_DEVIS_LABELS } from '@/types/index'
import type { StatutCommande, StatutDevis, TypeClient } from '@prisma/client'

interface ClientData {
  id: string
  nom: string
  telephone: string
  whatsapp: string | null
  email: string | null
  adresse: string | null
  type: TypeClient
  notes: string | null
  totalDepense: number
  commandes: Array<{ id: string; numero: string; statut: StatutCommande; montantTotal: number; createdAt: string | Date }>
  devis: Array<{ id: string; numero: string; statut: StatutDevis; createdAt: string | Date }>
}

const TYPE_LABELS: Record<TypeClient, string> = {
  PARTICULIER: 'Particulier',
  ENTREPRISE: 'Entreprise',
  MUNICIPALITE: 'Municipalité',
}

const BADGE_CMD: Record<StatutCommande, string> = {
  RECUE: 'bg-blue-light text-blue-teralite',
  EN_ATTENTE_PAIEMENT: 'bg-orange-light text-orange-teralite',
  CONFIRMEE: 'bg-green-light text-green-teralite',
  EN_PREPARATION: 'bg-blue-light text-blue-dark',
  EXPEDIEE: 'bg-blue-light text-blue-dark',
  LIVREE: 'bg-green-light text-green-teralite',
  ANNULEE: 'bg-red-light text-red-teralite',
}

const BADGE_DV: Record<StatutDevis, string> = {
  NOUVEAU: 'bg-orange-light text-orange-teralite',
  EN_COURS: 'bg-blue-light text-blue-teralite',
  ENVOYE: 'bg-blue-light text-blue-dark',
  ACCEPTE: 'bg-green-light text-green-teralite',
  REFUSE: 'bg-red-light text-red-teralite',
}

export default function ClientDetailClient({ client: initial }: { client: ClientData }) {
  const router = useRouter()
  const [nom, setNom] = useState(initial.nom)
  const [telephone, setTelephone] = useState(initial.telephone)
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [adresse, setAdresse] = useState(initial.adresse ?? '')
  const [type, setType] = useState<TypeClient>(initial.type)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const sauvegarder = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/admin/clients/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom, telephone,
          whatsapp: whatsapp || null,
          email: email || null,
          adresse: adresse || null,
          type, notes: notes || null,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Fiche éditable */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Informations</h2>
              <div className="flex items-center gap-2">
                {saved && <span className="flex items-center gap-1 text-xs text-green-teralite"><CheckCircle2 className="w-3.5 h-3.5" />Sauvegardé</span>}
                <button onClick={sauvegarder} disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-teralite text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" />{saving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </div>

            {[
              { label: 'Nom', value: nom, setter: setNom, type: 'text' },
              { label: 'Téléphone', value: telephone, setter: setTelephone, type: 'tel' },
              { label: 'WhatsApp', value: whatsapp, setter: setWhatsapp, type: 'tel' },
              { label: 'Email', value: email, setter: setEmail, type: 'email' },
              { label: 'Adresse', value: adresse, setter: setAdresse, type: 'text' },
            ].map(({ label, value, setter, type: t }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-text-mid mb-1">{label}</label>
                <input type={t} value={value} onChange={(e) => setter(e.target.value)}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as TypeClient)}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
                {(Object.keys(TYPE_LABELS) as TypeClient[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Notes libres</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
            </div>
          </div>

          {/* Total dépensé */}
          <div className="bg-blue-teralite rounded-xl p-5 text-white">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Total dépensé</p>
            <p className="text-2xl font-semibold">{formatFCFA(initial.totalDepense)}</p>
            <p className="text-xs text-white/60 mt-1">{initial.commandes.length} commande{initial.commandes.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Historique commandes + devis */}
        <div className="lg:col-span-2 space-y-6">

          {/* Commandes */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Commandes ({initial.commandes.length})</h2>
              <Link href={`/admin/commandes?q=${initial.nom}`} className="text-xs text-blue-teralite hover:underline">Voir tout →</Link>
            </div>
            <div className="divide-y divide-border-main">
              {initial.commandes.length === 0 ? (
                <p className="px-5 py-8 text-sm text-text-light text-center">Aucune commande</p>
              ) : (
                initial.commandes.map((cmd) => (
                  <Link key={cmd.id} href={`/admin/commandes/${cmd.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-fond transition-colors">
                    <span className="font-mono font-semibold text-blue-teralite text-sm">{cmd.numero}</span>
                    <span className="text-xs text-text-light">{formatDateCourte(new Date(cmd.createdAt))}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_CMD[cmd.statut]}`}>
                      {STATUT_COMMANDE_LABELS[cmd.statut]}
                    </span>
                    <span className="text-sm font-semibold text-text-main ml-2">{formatFCFA(cmd.montantTotal)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Devis */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Devis ({initial.devis.length})</h2>
              <Link href={`/admin/devis?q=${initial.nom}`} className="text-xs text-blue-teralite hover:underline">Voir tout →</Link>
            </div>
            <div className="divide-y divide-border-main">
              {initial.devis.length === 0 ? (
                <p className="px-5 py-8 text-sm text-text-light text-center">Aucun devis</p>
              ) : (
                initial.devis.map((dv) => (
                  <Link key={dv.id} href={`/admin/devis/${dv.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-fond transition-colors">
                    <span className="font-mono font-semibold text-blue-teralite text-sm">{dv.numero}</span>
                    <span className="text-xs text-text-light">{formatDateCourte(new Date(dv.createdAt))}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_DV[dv.statut]}`}>
                      {STATUT_DEVIS_LABELS[dv.statut]}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
