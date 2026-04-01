import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Teralite',
    default: 'Teralite — La lumière qui pense pour vous',
  },
  description:
    'Teralite — Solutions d\'éclairage LED professionnel à Dakar, Sénégal. Ampoules, luminaires, éclairage solaire et industriel.',
  keywords: ['éclairage LED', 'Dakar', 'Sénégal', 'ampoules', 'luminaires', 'solaire'],
  authors: [{ name: 'Teralite' }],
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Teralite',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
