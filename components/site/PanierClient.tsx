'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingCart, Tag, Loader2 } from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import { formatFCFA } from '@/lib/utils'

interface ZoneLivraison {
  id: string
  nom: string
  tarif: number
  delaiJours: number
}

interface PromoResult {
  valide: boolean
  type?: 'POURCENTAGE' | 'MONTANT_FIXE'
  valeur?: number
  message?: string
}

export default function PanierClient() {
  const { items, count, total, retirer, setQuantite, vider } = useCart()
  const [zones, setZones] = useState<ZoneLivraison[]>([])
  const [zoneId, setZoneId] = useState('')
  const [codePromo, setCodePromo] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  useEffect(() => {
    fetch('/api/zones')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setZones(data)
      })
      .catch(() => {})
  }, [])

  const zoneSelectionnee = zones.find((z) => z.id === zoneId)
  const fraisLivraison = zoneSelectionnee?.tarif ?? 0

  const remise = promo?.valide
    ? promo.type === 'POURCENTAGE'
      ? Math.round(total * (promo.valeur! / 100))
      : promo.type === 'MONTANT_FIXE'
      ? Math.min(promo.valeur!, total)
      : 0
    : 0

  const totalFinal = total - remise + fraisLivraison

  const validerPromo = async () => {
    if (!codePromo.trim()) return
    setPromoLoading(true)
    setPromo(null)
    try {
      const res = await fetch('/api/promo/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codePromo.trim(), montantTotal: total }),
      })
      const data = await res.json()
      setPromo(data)
    } catch {
      setPromo({ valide: false, message: 'Erreur réseau.' })
    } finally {
      setPromoLoading(false)
    }
  }

  if (count === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-blue-teralite" />
        </div>
        <h1 className="text-xl font-semibold text-text-main mb-3">Votre panier est vide</h1>
        <p className="text-text-mid text-sm mb-6">
          Parcourez notre catalogue pour ajouter des produits.
        </p>
        <Link
          href="/produits"
          className="inline-block bg-blue-teralite text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-dark transition-colors"
        >
          Voir le catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-blue-teralite">
          Mon panier ({count} article{count > 1 ? 's' : ''})
        </h1>
        <button
          onClick={vider}
          className="text-xs text-red-teralite hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste articles */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.produitId}
              className="bg-white rounded-xl border border-border-main p-4 flex items-start gap-4"
            >
              {/* Photo */}
              <div className="w-20 h-20 bg-gray-fond rounded-lg overflow-hidden flex-shrink-0 relative">
                {item.photoUrl ? (
                  <Image src={item.photoUrl} alt={item.nom} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-border-main" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/produits/${item.slug}`}
                  className="text-sm font-semibold text-text-main hover:text-blue-teralite transition-colors line-clamp-1"
                >
                  {item.nom}
                </Link>
                <p className="text-xs text-text-light mt-0.5 mb-3">
                  {formatFCFA(item.prixUnitaire)} / unité
                </p>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Sélecteur quantité */}
                  <div className="flex items-center border border-border-main rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantite(item.produitId, item.quantite - 1)}
                      className="w-8 h-8 flex items-center justify-center text-text-mid hover:bg-gray-fond transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-9 text-center text-sm font-medium">{item.quantite}</span>
                    <button
                      onClick={() => setQuantite(item.produitId, item.quantite + 1)}
                      className="w-8 h-8 flex items-center justify-center text-text-mid hover:bg-gray-fond transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-teralite">
                      {formatFCFA(item.prixUnitaire * item.quantite)}
                    </span>
                    <button
                      onClick={() => retirer(item.produitId)}
                      className="text-text-light hover:text-red-teralite transition-colors"
                      aria-label="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="space-y-4">
          {/* Zone de livraison */}
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-sm font-semibold text-text-main mb-3">Zone de livraison</h3>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                         focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite"
            >
              <option value="">Sélectionner une zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom} — {formatFCFA(z.tarif)} ({z.delaiJours}j)
                </option>
              ))}
            </select>
          </div>

          {/* Code promo */}
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-sm font-semibold text-text-main mb-3">Code promotionnel</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={codePromo}
                onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
                placeholder="CODE"
                className="flex-1 border border-border-main rounded-lg px-3 py-2 text-sm text-text-main
                           focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                           placeholder:text-text-light uppercase"
              />
              <button
                onClick={validerPromo}
                disabled={promoLoading || !codePromo.trim()}
                className="bg-blue-teralite text-white px-3 py-2 rounded-lg text-sm font-medium
                           hover:bg-blue-dark transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                OK
              </button>
            </div>
            {promo && (
              <p className={`text-xs mt-2 flex items-center gap-1 ${promo.valide ? 'text-green-teralite' : 'text-red-teralite'}`}>
                {promo.valide ? '✓' : '✗'} {promo.message}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-sm font-semibold text-text-main mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-mid">Sous-total</span>
                <span className="font-medium">{formatFCFA(total)}</span>
              </div>
              {remise > 0 && (
                <div className="flex justify-between text-green-teralite">
                  <span>Remise promo</span>
                  <span>−{formatFCFA(remise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-mid">Livraison</span>
                <span className="font-medium">
                  {zoneId ? formatFCFA(fraisLivraison) : <span className="text-text-light text-xs">À sélectionner</span>}
                </span>
              </div>
              <div className="border-t border-border-main pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-text-main">Total</span>
                <span className="font-semibold text-blue-teralite text-base">{formatFCFA(totalFinal)}</span>
              </div>
            </div>

            <Link
              href={`/checkout?zone=${zoneId}&promo=${promo?.valide ? codePromo : ''}`}
              className={`mt-4 w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-3 rounded-lg transition-colors ${
                !zoneId
                  ? 'bg-text-light cursor-not-allowed pointer-events-none'
                  : 'bg-orange-teralite hover:bg-orange-dark'
              }`}
            >
              Passer la commande →
            </Link>
            {!zoneId && (
              <p className="text-xs text-text-light text-center mt-2">
                Sélectionnez une zone de livraison pour continuer
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
