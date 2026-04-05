'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ShoppingCart, CreditCard, Smartphone, Zap, Banknote } from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import { formatFCFA } from '@/lib/utils'

interface ZoneLivraison {
  id: string
  nom: string
  tarif: number
  delaiJours: number
}

interface PromoInfo {
  type: 'POURCENTAGE' | 'MONTANT_FIXE'
  valeur: number
  remise: number
}

const MOYENS_PAIEMENT = [
  { id: 'ORANGE_MONEY', label: 'Orange Money', desc: 'Paiement mobile sécurisé', icon: Smartphone, color: 'bg-[#FF6600]' },
  { id: 'WAVE',         label: 'Wave',         desc: 'Rapide et sans frais',     icon: Zap,        color: 'bg-[#1DC9DA]' },
  { id: 'YAS',          label: 'YAS',          desc: 'Paiement mobile YAS',      icon: CreditCard, color: 'bg-[#00A651]' },
  { id: 'CASH',         label: 'Cash livraison', desc: 'Payez à la réception',   icon: Banknote,   color: 'bg-gray-fond border border-border-main' },
]

interface CheckoutClientProps {
  zoneId: string
  codePromo: string
}

export default function CheckoutClient({ zoneId, codePromo }: CheckoutClientProps) {
  const router = useRouter()
  const { items, total, vider } = useCart()
  const [zone, setZone] = useState<ZoneLivraison | null>(null)
  const [promo, setPromo] = useState<PromoInfo | null>(null)
  const [typePaiement, setTypePaiement] = useState('ORANGE_MONEY')
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '' })
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  // Charger zone
  useEffect(() => {
    if (!zoneId) return
    fetch('/api/zones')
      .then((r) => r.json())
      .then((zones: ZoneLivraison[]) => {
        const z = zones.find((z) => z.id === zoneId)
        if (z) setZone(z)
      })
      .catch(() => {})
  }, [zoneId])

  // Charger promo
  useEffect(() => {
    if (!codePromo || total === 0) return
    fetch('/api/promo/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codePromo, montantTotal: total }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.valide) setPromo({ type: d.type, valeur: d.valeur, remise: d.remise }) })
      .catch(() => {})
  }, [codePromo, total])

  const fraisLivraison = zone?.tarif ?? 0
  const remise = promo?.remise ?? 0
  const totalFinal = total - remise + fraisLivraison

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setErreur('')
    setLoading(true)

    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            produitId: i.produitId,
            nom: i.nom,
            quantite: i.quantite,
            prixUnitaire: i.prixUnitaire,
          })),
          client: form,
          zoneId: zone?.id ?? '',
          fraisLivraison,
          codePromo: codePromo || null,
          remise,
          montantTotal: totalFinal,
          typePaiement,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErreur(data.error ?? 'Une erreur est survenue.')
        return
      }

      // Cash : aller directement à la confirmation
      if (typePaiement === 'CASH') {
        vider()
        router.push(`/commandes/${data.commandeId}/confirmation`)
        return
      }

      // Mobile money : rediriger vers PayDunya
      if (data.paymentUrl) {
        vider()
        window.location.href = data.paymentUrl
        return
      }

      setErreur('Impossible d\'initier le paiement.')
    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-text-main mb-3">Votre panier est vide</h1>
        <Link href="/produits" className="inline-block bg-blue-teralite text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-dark transition-colors">
          Voir le catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-blue-teralite mb-8">Finaliser ma commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche — formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos client */}
            <div className="bg-white rounded-xl border border-border-main p-6">
              <h2 className="text-base font-semibold text-text-main mb-4">Vos informations</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text" required value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Moussa Diallo"
                    className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
                    Téléphone / WhatsApp *
                  </label>
                  <input
                    type="tel" required value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="+221 77 000 00 00"
                    className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
                    Adresse de livraison *
                  </label>
                  <textarea
                    required rows={2} value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Quartier, rue, numéro, point de repère..."
                    className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite placeholder:text-text-light transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Moyen de paiement */}
            <div className="bg-white rounded-xl border border-border-main p-6">
              <h2 className="text-base font-semibold text-text-main mb-4">Moyen de paiement</h2>
              <div className="space-y-2">
                {MOYENS_PAIEMENT.map((mp) => {
                  const Icon = mp.icon
                  const selected = typePaiement === mp.id
                  return (
                    <label
                      key={mp.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selected ? 'border-blue-teralite bg-blue-light/30' : 'border-border-main hover:border-blue-teralite/30'
                      }`}
                    >
                      <input
                        type="radio" name="paiement" value={mp.id}
                        checked={selected}
                        onChange={() => setTypePaiement(mp.id)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-full ${mp.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${mp.id === 'CASH' ? 'text-text-mid' : 'text-white'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-main">{mp.label}</p>
                        <p className="text-xs text-text-light">{mp.desc}</p>
                      </div>
                      {selected && (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-teralite bg-blue-teralite flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Colonne droite — récap */}
          <div>
            <div className="bg-white rounded-xl border border-border-main p-5 sticky top-24">
              <h2 className="text-base font-semibold text-text-main mb-4">Votre commande</h2>

              {/* Articles */}
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.produitId} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-fond rounded-lg overflow-hidden relative flex-shrink-0">
                      {item.photoUrl ? (
                        <Image src={item.photoUrl} alt={item.nom} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-border-main" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-main truncate">{item.nom}</p>
                      <p className="text-xs text-text-light">×{item.quantite}</p>
                    </div>
                    <span className="text-xs font-semibold text-text-main flex-shrink-0">
                      {formatFCFA(item.prixUnitaire * item.quantite)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-main pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-text-mid">Sous-total</span>
                  <span>{formatFCFA(total)}</span>
                </div>
                {remise > 0 && (
                  <div className="flex justify-between text-green-teralite">
                    <span>Remise ({codePromo})</span>
                    <span>−{formatFCFA(remise)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-mid">Livraison</span>
                  <span>{zone ? formatFCFA(fraisLivraison) : '—'}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t border-border-main pt-2">
                  <span>Total</span>
                  <span className="text-blue-teralite">{formatFCFA(totalFinal)}</span>
                </div>
              </div>

              {zone && (
                <p className="text-xs text-text-light mb-4">
                  Livraison {zone.nom} — {zone.delaiJours} jour{zone.delaiJours > 1 ? 's' : ''} ouvré{zone.delaiJours > 1 ? 's' : ''}
                </p>
              )}

              {erreur && (
                <div className="bg-red-light border border-red-teralite/30 rounded-xl px-4 py-3 mb-4 text-sm text-red-teralite">
                  {erreur}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-teralite hover:bg-orange-dark text-white text-sm font-medium py-3 rounded-lg
                           transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? 'Traitement...'
                  : typePaiement === 'CASH'
                  ? 'Confirmer la commande'
                  : 'Payer maintenant'}
              </button>

              <p className="text-xs text-text-light text-center mt-3">
                🔒 Paiement sécurisé via PayDunya
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
