import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import FaqAccordion from '@/components/site/FaqAccordion'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'FAQ — Questions fréquentes | Teralite',
  description:
    'Retrouvez les réponses à toutes vos questions sur les produits Teralite, les livraisons, les paiements et le service après-vente.',
}

const FAQS_DEFAUT = [
  {
    id: '1',
    question: 'Quelles économies puis-je réaliser avec des ampoules LED ?',
    reponse: 'Les ampoules LED consomment jusqu\'à 80% moins d\'énergie que les ampoules incandescentes et 50% de moins que les fluocompactes. Sur une facture mensuelle de 20 000 FCFA, vous pouvez économiser jusqu\'à 10 000 FCFA.',
    categorie: 'Produits',
  },
  {
    id: '2',
    question: 'Quelle est la durée de vie de vos produits LED ?',
    reponse: 'Nos produits LED ont une durée de vie garantie de 25 000 heures minimum. À raison de 8 heures d\'utilisation par jour, cela représente plus de 8 ans de fonctionnement.',
    categorie: 'Produits',
  },
  {
    id: '3',
    question: 'Quels sont vos modes de paiement ?',
    reponse: 'Nous acceptons Orange Money, Wave, YAS et le paiement en espèces à la livraison. Tous les paiements mobiles sont traités de manière sécurisée via PayDunya.',
    categorie: 'Paiement',
  },
  {
    id: '4',
    question: 'Livrez-vous dans toutes les régions du Sénégal ?',
    reponse: 'Oui, nous livrons dans toutes les 14 régions du Sénégal. La livraison à Dakar est effectuée sous 24-48h. Pour les autres régions, comptez 3 à 5 jours ouvrés.',
    categorie: 'Livraison',
  },
  {
    id: '5',
    question: 'Comment suivre ma commande ?',
    reponse: 'Vous pouvez suivre votre commande en temps réel depuis la page "Suivi de commande" en saisissant votre numéro de commande. Vous recevrez également des notifications WhatsApp à chaque étape.',
    categorie: 'Livraison',
  },
  {
    id: '6',
    question: 'Proposez-vous un service après-vente ?',
    reponse: 'Oui, notre équipe SAV est disponible par WhatsApp. En cas de produit défectueux, nous procédons à un remplacement rapide. Nos produits sont garantis conformément aux conditions générales de vente.',
    categorie: 'SAV',
  },
]

async function getFAQs() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { actif: true },
      orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }],
    })
    return faqs.length > 0 ? faqs : FAQS_DEFAUT
  } catch {
    return FAQS_DEFAUT
  }
}

export default async function FAQPage() {
  const faqs = await getFAQs()
  const categories = Array.from(new Set(faqs.map((f) => f.categorie)))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
          Centre d&apos;aide
        </p>
        <h1 className="text-2xl font-semibold text-blue-teralite mb-3">
          Questions fréquentes
        </h1>
        <p className="text-text-mid text-sm">
          Trouvez rapidement les réponses à vos questions.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3 px-1">
            {cat}
          </h2>
          <FaqAccordion faqs={faqs.filter((f) => f.categorie === cat)} />
        </div>
      ))}

      {/* CTA contact */}
      <div className="bg-blue-light rounded-xl p-6 text-center mt-10">
        <p className="text-sm font-semibold text-text-main mb-2">
          Vous n&apos;avez pas trouvé votre réponse ?
        </p>
        <p className="text-xs text-text-mid mb-4">
          Notre équipe est disponible par WhatsApp ou via le formulaire de contact.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/contact"
            className="bg-blue-teralite text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-dark transition-colors"
          >
            Nous contacter
          </Link>
          <a
            href="https://wa.me/221XXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
