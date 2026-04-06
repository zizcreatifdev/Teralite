import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'À propos de Teralite | Éclairage LED Sénégal',
  description:
    'Teralite est votre spécialiste de l\'éclairage LED intelligent au Sénégal. Découvrez notre mission, nos valeurs et notre équipe basée à Dakar.',
}

const DEFAULTS: Record<string, string> = {
  apropos_presentation:
    'Teralite propose des solutions d\'éclairage LED intelligentes avec détection automatique, adaptées aux réalités sénégalaises.\n\nNos produits s\'allument automatiquement à votre passage et s\'éteignent seuls, vous permettant d\'économiser jusqu\'à 70% sur votre facture d\'électricité. Simple. Efficace. Accessible.',
  apropos_mission:
    'Notre mission est de rendre accessible à tous les Sénégalais des solutions d\'éclairage LED intelligent de qualité supérieure, à des prix abordables, avec un service client irréprochable.',
  apropos_vision:
    'Nous croyons qu\'un bon éclairage améliore la qualité de vie et la productivité. Notre vision est d\'être le partenaire de référence pour l\'éclairage LED intelligent au Sénégal et en Afrique de l\'Ouest.',
  apropos_valeur1_emoji: '🔬',
  apropos_valeur1_titre: 'Qualité garantie',
  apropos_valeur1_texte: 'Tous nos produits sont certifiés et testés pour une durée de vie supérieure à 30 000 heures selon le modèle.',
  apropos_valeur2_emoji: '🤝',
  apropos_valeur2_titre: 'Service client',
  apropos_valeur2_texte: 'Une équipe dédiée disponible pour vous accompagner avant et après votre achat.',
  apropos_valeur3_emoji: '🚚',
  apropos_valeur3_titre: 'Livraison rapide',
  apropos_valeur3_texte: 'Livraison à Dakar et dans toutes les régions du Sénégal.',
  apropos_stat1_valeur: '500+',
  apropos_stat1_label: 'Projets réalisés',
  apropos_stat2_valeur: '3 ans',
  apropos_stat2_label: "D'expérience",
  apropos_stat3_valeur: '14',
  apropos_stat3_label: 'Régions couvertes',
  apropos_stat4_valeur: '98%',
  apropos_stat4_label: 'Clients satisfaits',
}

async function getContenu(): Promise<Record<string, string>> {
  try {
    const items = await prisma.contenuSite.findMany({
      where: { cle: { startsWith: 'apropos_' } },
    })
    const fromDb = Object.fromEntries(items.map((i) => [i.cle, i.valeur]))
    return { ...DEFAULTS, ...fromDb }
  } catch {
    return DEFAULTS
  }
}

export default async function AProposPage() {
  const c = await getContenu()

  const valeurs = [
    { emoji: c.apropos_valeur1_emoji, titre: c.apropos_valeur1_titre, texte: c.apropos_valeur1_texte },
    { emoji: c.apropos_valeur2_emoji, titre: c.apropos_valeur2_titre, texte: c.apropos_valeur2_texte },
    { emoji: c.apropos_valeur3_emoji, titre: c.apropos_valeur3_titre, texte: c.apropos_valeur3_texte },
  ]

  const stats = [
    { valeur: c.apropos_stat1_valeur, label: c.apropos_stat1_label },
    { valeur: c.apropos_stat2_valeur, label: c.apropos_stat2_label },
    { valeur: c.apropos_stat3_valeur, label: c.apropos_stat3_label },
    { valeur: c.apropos_stat4_valeur, label: c.apropos_stat4_label },
  ]

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
        <p className="text-text-mid text-base max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
          {c.apropos_presentation}
        </p>
      </div>

      {/* Valeurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {valeurs.map((v) => (
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
          <p className="text-text-mid text-sm leading-relaxed">{c.apropos_mission}</p>
        </div>
        <div className="border-l-4 border-orange-teralite bg-orange-light/30 rounded-r-xl px-6 py-5">
          <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
            Notre vision
          </p>
          <p className="text-text-mid text-sm leading-relaxed">{c.apropos_vision}</p>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="bg-blue-teralite rounded-xl p-8 text-white text-center mb-14">
        <h2 className="text-lg font-semibold mb-6">Teralite en chiffres</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
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
