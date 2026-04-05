import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/admin/AdminHeader'
import ParametresManager from '@/components/admin/ParametresManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Paramètres — Admin Teralite' }

const CLES = [
  'entreprise_nom',
  'entreprise_adresse',
  'entreprise_telephone',
  'entreprise_email',
  'entreprise_ninea',
  'entreprise_logo_url',
  'pdf_couleur_accent',
  'pdf_footer_texte',
  'pdf_conditions_generales',
  'paydunya_mode',
  'sauvegarde_derniere_date',
]

export default async function AdminParametresPage() {
  const rows = await prisma.parametres
    .findMany({ where: { cle: { in: CLES } } })
    .catch(() => [])

  const params = Object.fromEntries(rows.map((r) => [r.cle, r.valeur]))

  // Valeurs par défaut
  const defaults: Record<string, string> = {
    entreprise_nom: 'Teralite',
    entreprise_adresse: 'Dakar, Sénégal',
    entreprise_telephone: '',
    entreprise_email: 'contact@teralite.sn',
    entreprise_ninea: '',
    entreprise_logo_url: '',
    pdf_couleur_accent: '#004880',
    pdf_footer_texte: 'Teralite · teralite.sn · contact@teralite.sn',
    pdf_conditions_generales: 'Paiement à réception de la facture. Tout litige sera soumis à la juridiction de Dakar.',
    paydunya_mode: 'test',
    sauvegarde_derniere_date: '',
  }

  const parametres = { ...defaults, ...params }

  return (
    <>
      <AdminHeader titre="Paramètres système" sousTitre="Configuration entreprise, PayDunya, PDF, sauvegardes" />
      <ParametresManager parametres={parametres} />
    </>
  )
}
