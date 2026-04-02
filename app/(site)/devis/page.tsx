import type { Metadata } from 'next'
import DevisForm from '@/components/site/DevisForm'
import { CheckCircle, Clock, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Demande de devis — Éclairage LED | Teralite',
  description:
    "Obtenez votre devis personnalisé gratuitement. Teralite vous répond sous 24h pour tous vos projets d'éclairage LED à Dakar et au Sénégal.",
}

export default function DevisPage({
  searchParams,
}: {
  searchParams: { produit?: string }
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* En-tête */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
          Gratuit &amp; sans engagement
        </p>
        <h1 className="text-2xl font-semibold text-blue-teralite mb-3">
          Demandez votre devis personnalisé
        </h1>
        <p className="text-text-mid text-sm max-w-xl mx-auto">
          Décrivez votre projet d&apos;éclairage et notre équipe vous prépare
          une offre sur mesure sous 24 heures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="md:col-span-2">
          <DevisForm produitPreselectionne={searchParams.produit} />
        </div>

        {/* Infos sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-sm font-semibold text-text-main mb-4">
              Pourquoi demander un devis ?
            </h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, text: 'Offre personnalisée selon votre budget' },
                { icon: Clock, text: 'Réponse garantie sous 24h ouvrées' },
                { icon: Phone, text: 'Suivi par WhatsApp si vous le souhaitez' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-green-teralite flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-text-mid leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-teralite rounded-xl p-5 text-white">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">
              Contact direct
            </p>
            <p className="text-sm font-medium mb-1">Parler à un conseiller</p>
            <a
              href="https://wa.me/221XXXXXXXX"
              className="text-orange-teralite text-sm font-semibold hover:underline"
            >
              WhatsApp →
            </a>
          </div>

          <div className="bg-green-light rounded-xl border border-green-teralite/20 p-5">
            <p className="text-xs font-semibold text-green-teralite uppercase tracking-wider mb-2">
              Ils nous font confiance
            </p>
            <p className="text-xs text-text-mid leading-relaxed">
              Plus de 500 projets réalisés à Dakar et dans les régions du Sénégal.
              Résidentiel, commercial, industriel et municipal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
