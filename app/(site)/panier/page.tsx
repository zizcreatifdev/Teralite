import type { Metadata } from 'next'
import PanierClient from '@/components/site/PanierClient'

export const metadata: Metadata = {
  title: 'Mon panier | Teralite',
  robots: 'noindex',
}

export default function PanierPage() {
  return <PanierClient />
}
