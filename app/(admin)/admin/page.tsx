import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminHeader from '@/components/admin/AdminHeader'
import {
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tableau de bord',
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      <AdminHeader
        titre="Tableau de bord"
        sousTitre={`Bienvenue, ${session?.user?.name ?? 'Administrateur'}`}
      />
      <div className="flex-1 p-8 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-teralite rounded-xl p-6 text-white">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
              Commandes du mois
            </p>
            <p className="text-3xl font-semibold">0</p>
            <p className="text-xs text-white/70 mt-1">Aucune commande encore</p>
          </div>
          <div className="bg-orange-teralite rounded-xl p-6 text-white">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
              Chiffre d&apos;affaires
            </p>
            <p className="text-3xl font-semibold">0 F</p>
            <p className="text-xs text-white/70 mt-1">Ce mois-ci</p>
          </div>
          <div className="bg-green-teralite rounded-xl p-6 text-white">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
              Devis en attente
            </p>
            <p className="text-3xl font-semibold">0</p>
            <p className="text-xs text-white/70 mt-1">À traiter</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-border-main">
            <p className="text-xs text-text-light uppercase tracking-wider mb-1">
              Produits actifs
            </p>
            <p className="text-3xl font-semibold text-text-main">0</p>
            <p className="text-xs text-text-light mt-1">Dans le catalogue</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-sm border border-border-main overflow-hidden mb-6">
          <div className="px-8 py-6 border-b border-border-main">
            <h2 className="text-lg font-semibold text-text-main">Actions rapides</h2>
          </div>
          <div className="px-8 py-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Nouvelle commande', icon: ShoppingCart, href: '/admin/commandes/nouveau' },
                { label: 'Nouveau devis', icon: FileText, href: '/admin/devis/nouveau' },
                { label: 'Nouveau produit', icon: Package, href: '/admin/produits/nouveau' },
                { label: 'Comptabilité', icon: DollarSign, href: '/admin/comptabilite' },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <a
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border-main hover:bg-blue-light/50 hover:border-blue-teralite/30 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-light rounded-xl flex items-center justify-center group-hover:bg-blue-teralite transition-colors">
                      <Icon className="w-5 h-5 text-blue-teralite group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-text-mid text-center leading-tight">
                      {action.label}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Message de bienvenue pour la phase 1 */}
        <div className="bg-blue-light border border-blue-teralite/20 rounded-xl px-5 py-4">
          <p className="text-sm text-blue-teralite">
            <strong>Phase 1 complétée.</strong> Les fondations du projet sont en place —
            base de données, authentification, et layout admin sont configurés.
            La prochaine étape est la Phase 2 : site public vitrine.
          </p>
        </div>
      </div>
    </>
  )
}
