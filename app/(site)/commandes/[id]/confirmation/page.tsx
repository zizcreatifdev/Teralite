import type { Metadata } from 'next'
import ConfirmationClient from '@/components/site/ConfirmationClient'

export const metadata: Metadata = {
  title: 'Commande confirmée | Teralite',
  robots: 'noindex',
}

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  return <ConfirmationClient commandeId={params.id} />
}
