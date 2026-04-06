import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'
import { MapPin, Mail, Clock, Globe, TrendingDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact | Teralite — Éclairage LED Sénégal',
  description:
    'Contactez l\'équipe Teralite par email ou via notre formulaire. contact@teralitegroup.com — Nous répondons sous 24h.',
}

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-2">
          On est là pour vous
        </p>
        <h1 className="text-2xl font-semibold text-blue-teralite mb-3">
          Nous contacter
        </h1>
        <p className="text-text-mid text-sm max-w-xl mx-auto">
          Une question, un projet, un partenariat ? Notre équipe vous répond rapidement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="md:col-span-2">
          <ContactForm />
        </div>

        {/* Infos de contact */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-sm font-semibold text-text-main mb-4">Coordonnées</h3>
            <div className="space-y-3">
              {[
                { Icon: MapPin, label: 'Adresse', value: 'Dakar, Sénégal' },
                { Icon: Mail, label: 'Email', value: 'contact@teralitegroup.com', href: 'mailto:contact@teralitegroup.com' },
                { Icon: Globe, label: 'Site web', value: 'www.TeraLiteGroup.com', href: 'https://www.TeraLiteGroup.com' },
                { Icon: Clock, label: 'Horaires', value: 'Lun–Sam, 8h–18h' },
              ].map(({ Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-teralite" />
                  </div>
                  <div>
                    <p className="text-xs text-text-light">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-blue-teralite hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-text-main">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section ROI */}
          <div className="bg-green-light border border-green-teralite/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-green-teralite" />
              <h3 className="text-sm font-semibold text-green-teralite">Exemple concret d&apos;économie</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-mid">Facture actuelle</span>
                <span className="font-semibold text-red-teralite">45 000 FCFA/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-mid">Avec Teralite</span>
                <span className="font-semibold text-green-teralite">15 000 FCFA/mois</span>
              </div>
              <div className="border-t border-green-teralite/20 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-text-main font-medium">Économie mensuelle</span>
                  <span className="font-bold text-green-teralite">30 000 FCFA</span>
                </div>
                <p className="text-xs text-green-teralite mt-1 text-right font-semibold">
                  = 360 000 FCFA/an
                </p>
              </div>
            </div>
          </div>

          {/* Carte Google Maps placeholder */}
          <div className="bg-gray-fond rounded-xl h-40 flex items-center justify-center border border-border-main">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-text-light mx-auto mb-2" />
              <p className="text-xs text-text-light">Dakar, Sénégal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
