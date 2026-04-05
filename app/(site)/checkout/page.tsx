import type { Metadata } from 'next'
import CheckoutClient from '@/components/site/CheckoutClient'

export const metadata: Metadata = {
  title: 'Finaliser ma commande | Teralite',
  robots: 'noindex',
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: { zone?: string; promo?: string }
}) {
  return <CheckoutClient zoneId={searchParams.zone ?? ''} codePromo={searchParams.promo ?? ''} />
}
