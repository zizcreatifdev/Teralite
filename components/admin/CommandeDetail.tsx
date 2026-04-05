'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  FileText,
  Download,
  MessageSquare,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import { STATUT_COMMANDE_LABELS, TYPE_PAIEMENT_LABELS } from '@/types/index'
import type { StatutCommande } from '@prisma/client'

const BADGE_STATUT: Record<StatutCommande, string> = {
  RECUE: 'bg-blue-light text-blue-teralite',
  EN_ATTENTE_PAIEMENT: 'bg-orange-light text-orange-teralite',
  CONFIRMEE: 'bg-green-light text-green-teralite',
  EN_PREPARATION: 'bg-blue-light text-blue-dark',
  EXPEDIEE: 'bg-blue-light text-blue-dark',
  LIVREE: 'bg-green-light text-green-teralite',
  ANNULEE: 'bg-red-light text-red-teralite',
}

const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  RECUE: ['CONFIRMEE', 'EN_PREPARATION', 'ANNULEE'],
  EN_ATTENTE_PAIEMENT: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['EN_PREPARATION', 'ANNULEE'],
  EN_PREPARATION: ['EXPEDIEE', 'ANNULEE'],
  EXPEDIEE: ['LIVREE', 'ANNULEE'],
  LIVREE: [],
  ANNULEE: [],
}

interface LigneCommande {
  id: string
  quantite: number
  prixUnitaire: number
  sousTotal: number
  produit: {
    id: string
    nom: string
    reference: string
    photos: { url: string }[]
  }
}

interface HistoriqueStatut {
  id: string
  statut: StatutCommande
  note: string | null
  createdAt: string | Date
}

interface CommandeData {
  id: string
  numero: string
  statut: StatutCommande
  typePaiement: string
  montantTotal: number
  fraisLivraison: number
  adresseLivraison: string | null
  notes: string | null
  paydunyaRef: string | null
  createdAt: string | Date
  client: {
    nom: string
    telephone: string
    email: string | null
    adresse: string | null
    type: string
  }
  zone: { nom: string; tarif: number } | null
  lignes: LigneCommande[]
  historique: HistoriqueStatut[]
  facture: { id: string; numero: string; montantTTC: number } | null
}

export default function CommandeDetail({ commande: initial }: { commande: CommandeData }) {
  const router = useRouter()
  const [commande, setCommande] = useState(initial)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [changingStatut, setChangingStatut] = useState<StatutCommande | null>(null)
  const [generatingFacture, setGeneratingFacture] = useState(false)

  const sousTotal = commande.lignes.reduce((s, l) => s + l.sousTotal, 0)
  const statuts = TRANSITIONS[commande.statut]

  const changerStatut = async (nouveau: StatutCommande) => {
    setChangingStatut(nouveau)
    try {
      const res = await fetch(`/api/admin/commandes/${commande.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveau }),
      })
      if (res.ok) {
        const updated = await res.json() as CommandeData
        setCommande((prev) => ({ ...prev, statut: updated.statut }))
        router.refresh()
      }
    } finally {
      setChangingStatut(null)
    }
  }

  const sauvegarderNotes = async () => {
    setSavingNotes(true)
    setNotesSaved(false)
    try {
      await fetch(`/api/admin/commandes/${commande.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    } finally {
      setSavingNotes(false)
    }
  }

  const genererFacture = async () => {
    setGeneratingFacture(true)
    try {
      const res = await fetch(`/api/admin/commandes/${commande.id}/facture`, { method: 'POST' })
      if (res.ok) {
        const facture = await res.json() as { id: string; numero: string; montantTTC: number }
        setCommande((prev) => ({ ...prev, facture }))
      }
    } finally {
      setGeneratingFacture(false)
    }
  }

  const exporterCSV = () => {
    window.open(`/api/admin/commandes/${commande.id}/export`, '_blank')
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">

      {/* Actions en haut */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Changer statut */}
        {statuts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-light">Passer en :</span>
            {statuts.map((s) => (
              <button
                key={s}
                onClick={() => changerStatut(s)}
                disabled={changingStatut !== null}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                  s === 'ANNULEE'
                    ? 'border-red-teralite text-red-teralite hover:bg-red-light'
                    : 'border-blue-teralite text-blue-teralite hover:bg-blue-light'
                }`}
              >
                {changingStatut === s ? '…' : STATUT_COMMANDE_LABELS[s]}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {commande.facture ? (
            <span className="flex items-center gap-1.5 text-sm text-green-teralite font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Facture {commande.facture.numero}
            </span>
          ) : (
            <button
              onClick={genererFacture}
              disabled={generatingFacture}
              className="flex items-center gap-2 text-sm border border-blue-teralite text-blue-teralite px-3 py-1.5 rounded-lg hover:bg-blue-light transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {generatingFacture ? 'Génération…' : 'Générer facture'}
            </button>
          )}
          <button
            onClick={exporterCSV}
            className="flex items-center gap-2 text-sm border border-border-main text-text-mid px-3 py-1.5 rounded-lg hover:bg-gray-fond transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <a
            href={`https://wa.me/${commande.client.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${commande.client.nom}, concernant votre commande ${commande.numero}…`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm border border-green-teralite text-green-teralite px-3 py-1.5 rounded-lg hover:bg-green-light transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale : produits */}
        <div className="lg:col-span-2 space-y-6">

          {/* Lignes commande */}
          <div className="bg-white rounded-xl border border-border-main overflow-hidden">
            <div className="px-5 py-4 border-b border-border-main">
              <h2 className="text-sm font-semibold text-text-main">
                Produits commandés ({commande.lignes.length})
              </h2>
            </div>
            <div className="divide-y divide-border-main">
              {commande.lignes.map((ligne) => {
                const photo = ligne.produit.photos[0]
                return (
                  <div key={ligne.id} className="flex items-center gap-4 px-5 py-4">
                    {photo ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border-main flex-shrink-0">
                        <Image src={photo.url} alt={ligne.produit.nom} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-fond border border-border-main flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">{ligne.produit.nom}</p>
                      <p className="text-xs text-text-light font-mono">{ligne.produit.reference}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text-main">{formatFCFA(ligne.sousTotal)}</p>
                      <p className="text-xs text-text-light">
                        {ligne.quantite} × {formatFCFA(ligne.prixUnitaire)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Totaux */}
            <div className="border-t border-border-main px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-text-mid">
                <span>Sous-total</span>
                <span>{formatFCFA(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-mid">
                <span>Livraison ({commande.zone?.nom ?? 'Standard'})</span>
                <span>{formatFCFA(commande.fraisLivraison)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-text-main pt-2 border-t border-border-main">
                <span>Total</span>
                <span>{formatFCFA(commande.montantTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes internes */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Notes internes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Notes visibles uniquement par l'équipe admin…"
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={sauvegarderNotes}
                disabled={savingNotes}
                className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingNotes ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {notesSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-teralite">
                  <CheckCircle2 className="w-4 h-4" />
                  Sauvegardé
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Colonne secondaire : infos client + historique */}
        <div className="space-y-6">

          {/* Statut actuel */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Statut de la commande</h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${BADGE_STATUT[commande.statut]}`}>
                {STATUT_COMMANDE_LABELS[commande.statut]}
              </span>
            </div>
            <div className="text-xs text-text-light space-y-1">
              <p>Numéro : <span className="font-mono font-semibold text-text-main">{commande.numero}</span></p>
              <p>Date : {formatDate(new Date(commande.createdAt))}</p>
              <p>Paiement : {TYPE_PAIEMENT_LABELS[commande.typePaiement as keyof typeof TYPE_PAIEMENT_LABELS]}</p>
              {commande.paydunyaRef && <p className="font-mono">Réf. PayDunya : {commande.paydunyaRef}</p>}
            </div>
          </div>

          {/* Infos client */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-2">
            <h2 className="text-sm font-semibold text-text-main">Client</h2>
            <p className="font-medium text-text-main">{commande.client.nom}</p>
            <p className="text-sm text-text-mid">{commande.client.telephone}</p>
            {commande.client.email && <p className="text-sm text-text-mid">{commande.client.email}</p>}
            {commande.adresseLivraison && (
              <p className="text-sm text-text-mid">{commande.adresseLivraison}</p>
            )}
            {commande.zone && (
              <p className="text-xs text-text-light">Zone : {commande.zone.nom} — {formatFCFA(commande.zone.tarif)}</p>
            )}
          </div>

          {/* Historique des statuts */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Historique</h2>
            <div className="space-y-3">
              {commande.historique.map((h, idx) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${idx === 0 ? 'bg-blue-teralite' : 'bg-border-main'}`} />
                    {idx < commande.historique.length - 1 && (
                      <div className="w-px flex-1 bg-border-main mt-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold text-text-main">
                      {STATUT_COMMANDE_LABELS[h.statut]}
                    </p>
                    {h.note && <p className="text-xs text-text-light">{h.note}</p>}
                    <p className="text-xs text-text-light mt-0.5">
                      {formatDate(new Date(h.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lien vers la vue client */}
          <Link
            href={`/commandes/${commande.id}/confirmation`}
            target="_blank"
            className="flex items-center gap-2 text-sm text-text-light border border-border-main px-4 py-3 rounded-xl hover:bg-gray-fond transition-colors"
          >
            <span className="flex-1">Vue client</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
