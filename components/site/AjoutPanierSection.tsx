'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, FileText, Minus, Plus } from 'lucide-react'
import type { TypeProduit } from '@prisma/client'

interface AjoutPanierSectionProps {
  produitId: string
  nom: string
  prixPublic: number | null
  statut: TypeProduit
}

export default function AjoutPanierSection({
  produitId,
  nom,
  prixPublic,
  statut,
}: AjoutPanierSectionProps) {
  const [quantite, setQuantite] = useState(1)

  const indisponible = statut === 'RUPTURE'

  return (
    <div className="space-y-3">
      {/* Sélecteur quantité */}
      {prixPublic && !indisponible && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-blue-teralite uppercase tracking-wider">
            Quantité
          </span>
          <div className="flex items-center border border-border-main rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantite(Math.max(1, quantite - 1))}
              className="w-9 h-9 flex items-center justify-center text-text-mid hover:bg-gray-fond transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-medium text-text-main">
              {quantite}
            </span>
            <button
              onClick={() => setQuantite(quantite + 1)}
              className="w-9 h-9 flex items-center justify-center text-text-mid hover:bg-gray-fond transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Boutons actions */}
      <div className="flex flex-col gap-2">
        {prixPublic && !indisponible ? (
          <Link
            href={`/panier?ajout=${produitId}&qte=${quantite}`}
            className="flex items-center justify-center gap-2 bg-blue-teralite hover:bg-blue-dark text-white text-sm font-medium py-3 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Ajouter au panier
          </Link>
        ) : statut === 'RUPTURE' ? (
          <div className="flex items-center justify-center gap-2 bg-gray-fond text-text-light text-sm font-medium py-3 rounded-lg cursor-not-allowed border border-border-main">
            Rupture de stock
          </div>
        ) : null}

        <Link
          href={`/devis?produit=${encodeURIComponent(nom)}`}
          className="flex items-center justify-center gap-2 border border-blue-teralite text-blue-teralite hover:bg-blue-light text-sm font-medium py-3 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          Demander un devis
        </Link>
      </div>

      {/* Infos livraison */}
      <div className="border border-border-main rounded-xl p-4 space-y-2">
        {[
          { icon: '🚚', text: 'Livraison à Dakar : 1 à 2 jours ouvrés' },
          { icon: '📦', text: 'Régions du Sénégal : 3 à 5 jours' },
          { icon: '✅', text: 'Garantie qualité sur tous nos produits' },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-2.5">
            <span className="text-sm flex-shrink-0">{item.icon}</span>
            <span className="text-xs text-text-mid leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
