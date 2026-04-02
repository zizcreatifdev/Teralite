import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/site/ServiceWorkerRegister'

export const viewport: Viewport = {
  themeColor: '#004880',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    template: '%s | Teralite',
    default: 'Teralite — La lumière qui pense pour vous',
  },
  description:
    "Teralite : solutions d'éclairage LED professionnel à Dakar, Sénégal. Ampoules, plafonniers, éclairage solaire et industriel. Économisez jusqu'à 50% sur votre facture.",
  keywords: ['éclairage LED', 'Dakar', 'Sénégal', 'ampoules', 'luminaires', 'solaire', 'Teralite'],
  authors: [{ name: 'Teralite', url: 'https://teralite.sn' }],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://teralite.sn',
    siteName: 'Teralite',
    title: 'Teralite — La lumière qui pense pour vous',
    description: "Solutions d'éclairage LED professionnel au Sénégal.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teralite — La lumière qui pense pour vous',
    description: "Solutions d'éclairage LED professionnel au Sénégal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
