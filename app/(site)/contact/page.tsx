import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact | Teralite — Éclairage LED Sénégal',
  description:
    'Contactez l\'équipe Teralite par WhatsApp, email ou via notre formulaire. Nous répondons sous 24h.',
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
                { Icon: Phone, label: 'Téléphone', value: '+221 XX XXX XX XX' },
                { Icon: Mail, label: 'Email', value: 'contact@teralite.sn' },
                { Icon: Clock, label: 'Horaires', value: 'Lun–Sam, 8h–18h' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-teralite" />
                  </div>
                  <div>
                    <p className="text-xs text-text-light">{label}</p>
                    <p className="text-sm text-text-main">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a
            href="https://wa.me/221XXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] text-white rounded-xl p-5 hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">WhatsApp direct</p>
              <p className="text-xs text-white/80">Réponse rapide garantie</p>
            </div>
          </a>

          {/* Carte Google Maps placeholder */}
          <div className="bg-gray-fond rounded-xl h-48 flex items-center justify-center border border-border-main">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-text-light mx-auto mb-2" />
              <p className="text-xs text-text-light">Carte Google Maps</p>
              <p className="text-xs text-text-light">Dakar, Sénégal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
