'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  BarChart2,
  DollarSign,
  Megaphone,
  Settings,
  Star,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  {
    group: 'Principal',
    items: [
      { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/admin/produits', label: 'Produits', icon: Package },
      { href: '/admin/commandes', label: 'Commandes', icon: ShoppingCart },
      { href: '/admin/devis', label: 'Devis', icon: FileText },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/commissions', label: 'Commissions', icon: Star },
      { href: '/admin/comptabilite', label: 'Comptabilité', icon: DollarSign },
    ],
  },
  {
    group: 'Contenu',
    items: [
      { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
      { href: '/admin/contenu', label: 'Contenu site', icon: BarChart2 },
      { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
      { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const initiales = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD'

  return (
    <aside className="w-56 bg-blue-teralite min-h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href="/admin">
          <span className="text-white font-semibold text-lg tracking-wide">
            Teralite
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.group} className="mb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider px-3 mb-2 mt-4">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer sidebar — infos utilisateur + déconnexion */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-orange-teralite flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {session?.user?.name ?? 'Administrateur'}
            </p>
            <p className="text-xs text-white/50 truncate">
              {session?.user?.role ?? 'Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
