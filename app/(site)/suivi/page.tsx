import type { Metadata } from 'next'
import SuiviForm from '@/components/site/SuiviForm'

export const metadata: Metadata = {
  title: 'Suivi de commande | Teralite',
  description:
    'Suivez votre commande Teralite en temps réel. Entrez votre numéro de commande ou votre numéro de téléphone.',
}

export default function SuiviPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
          En temps réel
        </p>
        <h1 className="text-2xl font-semibold text-blue-teralite mb-3">
          Suivi de commande
        </h1>
        <p className="text-text-mid text-sm">
          Entrez votre numéro de commande (ex: <span className="font-mono text-text-main">#0042</span>) ou votre numéro de téléphone.
        </p>
      </div>
      <SuiviForm />
    </div>
  )
}
