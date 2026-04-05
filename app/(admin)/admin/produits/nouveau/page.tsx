import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import ProduitForm from '@/components/admin/ProduitForm'

export const metadata: Metadata = { title: 'Nouveau produit — Admin Teralite' }

export default function NouveauProduitPage() {
  return (
    <>
      <AdminHeader titre="Nouveau produit" sousTitre="Remplissez les informations du produit" />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <ProduitForm />
      </div>
    </>
  )
}
