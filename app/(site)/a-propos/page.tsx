import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'À propos de Teralite | Éclairage LED Sénégal',
  description:
    'Teralite est votre spécialiste de l\'éclairage LED au Sénégal. Découvrez notre mission, nos valeurs et notre équipe basée à Dakar.',
}

async function getContenu(cle: string, fallback: string) {
  try {
    const item = await prisma.contenuSite.findUnique({ where: { cle } })
    return item?.valeur ?? fallback
  } catch {
    return fallback
  }
}

export default async function AProposPage() {
  const [presentation, mission, vision] = await Promise.all([
    getContenu(
      'apropos_presentation',
      'Teralite propose des solutions d\'éclairage LED intelligentes avec détection automatique, adaptées aux réalités sénégalaises.\n\nNos produits s\'allument automatiquement à votre passage et s\'éteignent seuls, vous permettant d\'économiser jusqu\'à 70% sur votre facture d\'électricité. Simple. Efficace. Accessible.'
    ),
    getContenu(
      'apropos_mission',
      'Notre mission est de rendre accessible à tous les Sénégalais des solutions d\'éclairage LED intelligent de qualité supérieure, à des prix abordables, avec un service client irréprochable.'
    ),
    getContenu(
      'apropos_vision',
      'Nous croyons qu\'un bon éclairage améliore la qualité de vie et la productivité. Notre vision est d\'être le partenaire de référence pour l\'éclairage LED intelligent au Sénégal et en Afrique de l\'Ouest.'
    ),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
          Notre histoire
        </p>
        <h1 className="text-3xl font-semibold text-blue-teralite mb-4">
          À propos de Teralite
        </h1>
        <p className="text-text-mid text-base max-w-2xl mx-auto leading-relaxed">
          {presentation}
        </p>
      </div>

      {/* Valeurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {[
          {
            titre: 'Qualité garantie',
            texte: 'Tous nos produits sont certifiés et testés pour une durée de vie supérieure à 25 000 heures.',
            emoji: '🔬',
          },
          {
            titre: 'Service client',
            texte: 'Une équipe dédiée disponible par WhatsApp pour vous accompagner avant et après votre achat.',
            emoji: '🤝',
          },
          {
            titre: 'Livraison rapide',
            texte: 'Livraison à Dakar en 24-48h et dans toutes les régions du Sénégal en 3-5 jours.',
            emoji: '🚚',
          },
        ].map((v) => (
          <div key={v.titre} className="bg-white rounded-xl border border-border-main p-6">
            <div className="text-3xl mb-4">{v.emoji}</div>
            <h3 className="font-semibold text-text-main mb-2">{v.titre}</h3>
            <p className="text-text-mid text-sm leading-relaxed">{v.texte}</p>
          </div>
        ))}
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        <div className="border-l-4 border-blue-teralite bg-blue-light/30 rounded-r-xl px-6 py-5">
          <p className="text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
            Notre mission
          </p>
          <p className="text-text-mid text-sm leading-relaxed">{mission}</p>
        </div>
        <div className="border-l-4 border-orange-teralite bg-orange-light/30 rounded-r-xl px-6 py-5">
          <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
            Notre vision
          </p>
          <p className="text-text-mid text-sm leading-relaxed">{vision}</p>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="bg-blue-teralite rounded-xl p-8 text-white text-center mb-14">
        <h2 className="text-lg font-semibold mb-6">Teralite en chiffres</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { valeur: '500+', label: 'Projets réalisés' },
            { valeur: '3 ans', label: 'D\'expérience' },
            { valeur: '14', label: 'Régions couvertes' },
            { valeur: '98%', label: 'Clients satisfaits' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold text-orange-teralite">{s.valeur}</p>
              <p className="text-xs text-white/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
