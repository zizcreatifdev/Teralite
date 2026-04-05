'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Clock, Package, Truck, MessageCircle, Loader2 } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import type { StatutCommande, TypePaiement } from '@prisma/client'

interface LigneCommande {
  id: string
  quantite: number
  prixUnitaire: number
  sousTotal: number
  produit: {
    nom: string
    slug: string
    photos: { url: string }[]
  }
}

interface Commande {
  id: string
  numero: string
  statut: StatutCommande
  typePaiement: TypePaiement
  montantTotal: number
  fraisLivraison: number
  adresseLivraison: string | null
  createdAt: string
  client: { nom: string; telephone: string }
  lignes: LigneCommande[]
  zone: { nom: string; delaiJours: number } | null
  historique: { statut: StatutCommande; note: string | null; createdAt: string }[]
}

const STATUT_LABELS: Record<StatutCommande, { label: string; color: string }> = {
  RECUE:               { label: 'Commande reçue',           color: 'text-blue-teralite' },
  CONFIRMEE:           { label: 'Paiement confirmé',        color: 'text-blue-teralite' },
  EN_PREPARATION:      { label: 'En préparation',            color: 'text-orange-teralite' },
  EXPEDIEE:            { label: 'En cours de livraison',     color: 'text-orange-teralite' },
  LIVREE:              { label: 'Livrée ✓',                  color: 'text-green-teralite' },
  ANNULEE:             { label: 'Annulée',                   color: 'text-red-teralite' },
  EN_ATTENTE_PAIEMENT: { label: 'En attente de paiement',   color: 'text-text-light' },
}

const PAIEMENT_LABELS: Record<TypePaiement, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE:         'Wave',
  YAS:          'YAS',
  CASH:         'Cash à la livraison',
}

export default function ConfirmationClient({ commandeId }: { commandeId: string }) {
  const [commande, setCommande] = useState<Commande | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    fetch(`/api/commandes/${commandeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else setCommande(data)
      })
      .catch(() => setErreur('Impossible de charger la commande.'))
      .finally(() => setLoading(false))
  }, [commandeId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-teralite" />
        <span className="text-text-mid">Chargement de votre commande...</span>
      </div>
    )
  }

  if (erreur || !commande) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-teralite text-sm mb-4">{erreur || 'Commande introuvable.'}</p>
        <Link href="/" className="text-blue-teralite hover:underline text-sm">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  const estConfirmee = ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'].includes(commande.statut)
  const estCash = commande.typePaiement === 'CASH'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Banner confirmation */}
      <div className={`rounded-2xl p-8 text-center mb-8 ${estConfirmee || estCash ? 'bg-green-light border border-green-teralite/20' : 'bg-blue-light border border-blue-teralite/20'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${estConfirmee || estCash ? 'bg-green-teralite' : 'bg-blue-teralite'}`}>
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-xl font-semibold mb-2 ${estConfirmee || estCash ? 'text-green-teralite' : 'text-blue-teralite'}`}>
          {estCash ? 'Commande enregistrée !' : 'Merci pour votre commande !'}
        </h1>
        <p className="text-text-mid text-sm">
          {estCash
            ? 'Votre commande a été enregistrée. Notre équipe vous contactera par WhatsApp pour organiser la livraison et le paiement.'
            : 'Votre paiement a été confirmé. Notre équipe vous contactera très prochainement par WhatsApp.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Numéro et statut */}
        <div className="bg-white rounded-xl border border-border-main p-5">
          <p className="text-xs text-text-light uppercase tracking-wider mb-1">Numéro de commande</p>
          <p className="text-2xl font-bold font-mono text-blue-teralite mb-3">{commande.numero}</p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${STATUT_LABELS[commande.statut].color}`}>
              {STATUT_LABELS[commande.statut].label}
            </span>
          </div>
          <p className="text-xs text-text-light mt-2">
            Passée le {formatDate(new Date(commande.createdAt))}
          </p>
        </div>

        {/* Infos livraison */}
        <div className="bg-white rounded-xl border border-border-main p-5">
          <p className="text-xs text-text-light uppercase tracking-wider mb-3">Livraison</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-text-light flex-shrink-0 mt-0.5" />
              <span className="text-text-mid">{commande.zone?.nom ?? 'Zone non spécifiée'}</span>
            </div>
            {commande.zone && (
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-text-light flex-shrink-0 mt-0.5" />
                <span className="text-text-mid">{commande.zone.delaiJours} jour{commande.zone.delaiJours > 1 ? 's' : ''} ouvré{commande.zone.delaiJours > 1 ? 's' : ''}</span>
              </div>
            )}
            {commande.adresseLivraison && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-text-light flex-shrink-0 mt-0.5" />
                <span className="text-text-mid text-xs">{commande.adresseLivraison}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Articles commandés */}
      <div className="bg-white rounded-xl border border-border-main overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border-main">
          <h2 className="text-sm font-semibold text-text-main">Votre commande</h2>
        </div>
        <div className="divide-y divide-border-main">
          {commande.lignes.map((ligne) => (
            <div key={ligne.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-12 h-12 bg-gray-fond rounded-lg overflow-hidden relative flex-shrink-0">
                {ligne.produit.photos[0] ? (
                  <Image
                    src={ligne.produit.photos[0].url}
                    alt={ligne.produit.nom}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-border-main" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{ligne.produit.nom}</p>
                <p className="text-xs text-text-light">
                  {ligne.quantite} × {formatFCFA(ligne.prixUnitaire)}
                </p>
              </div>
              <span className="text-sm font-semibold text-text-main flex-shrink-0">
                {formatFCFA(ligne.sousTotal)}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-border-main bg-gray-fond/30 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-mid">Livraison</span>
            <span>{formatFCFA(commande.fraisLivraison)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base">
            <span>Total payé</span>
            <span className="text-blue-teralite">{formatFCFA(commande.montantTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-light">
            <span>Mode de paiement</span>
            <span>{PAIEMENT_LABELS[commande.typePaiement]}</span>
          </div>
        </div>
      </div>

      {/* Historique statuts */}
      {commande.historique.length > 0 && (
        <div className="bg-white rounded-xl border border-border-main p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-main mb-4">Suivi de commande</h2>
          <div className="space-y-3">
            {commande.historique.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUT_LABELS[h.statut].color.replace('text-', 'bg-')}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${STATUT_LABELS[h.statut].color}`}>
                      {STATUT_LABELS[h.statut].label}
                    </span>
                    <span className="text-xs text-text-light">{formatDate(new Date(h.createdAt))}</span>
                  </div>
                  {h.note && <p className="text-xs text-text-mid mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA WhatsApp + actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://wa.me/221XXXXXXXX"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-medium px-5 py-3 rounded-lg hover:opacity-90 transition-opacity flex-1"
        >
          <MessageCircle className="w-4 h-4" />
          Nous contacter sur WhatsApp
        </a>
        <Link
          href={`/suivi?q=${encodeURIComponent(commande.numero)}`}
          className="flex items-center justify-center gap-2 border border-border-main text-text-mid text-sm font-medium px-5 py-3 rounded-lg hover:bg-gray-fond transition-colors flex-1"
        >
          <Package className="w-4 h-4" />
          Suivre ma commande
        </Link>
        <Link
          href="/produits"
          className="flex items-center justify-center gap-2 border border-blue-teralite text-blue-teralite text-sm font-medium px-5 py-3 rounded-lg hover:bg-blue-light transition-colors flex-1"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  )
}
