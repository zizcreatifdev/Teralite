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
  TrendingUp,
  MapPin,
  ScrollText,
  Shield,
} from 'lucide-react'

// ─── Définition des menus ─────────────────────────────────────────────────────

type Role = 'VENDEUR' | 'ADMIN' | 'SUPER_ADMIN'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Role[]
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Principal',
    items: [
      { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/produits', label: 'Produits', icon: Package, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/commandes', label: 'Commandes', icon: ShoppingCart, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/devis', label: 'Devis', icon: FileText, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
      // Vendeur voit ses commissions, Admin/SuperAdmin voient toutes les commissions
      { href: '/admin/commissions/vendeur', label: 'Mes commissions', icon: Star, roles: ['VENDEUR'] },
      { href: '/admin/commissions', label: 'Commissions', icon: TrendingUp, roles: ['ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/comptabilite', label: 'Comptabilité', icon: DollarSign, roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    group: 'Contenu & Config',
    items: [
      { href: '/admin/contenu', label: 'Contenu site', icon: BarChart2, roles: ['VENDEUR', 'ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/promotions', label: 'Promotions', icon: Megaphone, roles: ['ADMIN', 'SUPER_ADMIN'] },
      { href: '/admin/parametres/zones', label: 'Zones livraison', icon: MapPin, roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { href: '/admin/utilisateurs', label: 'Équipe', icon: Users, roles: ['SUPER_ADMIN'] },
      { href: '/admin/parametres', label: 'Paramètres', icon: Settings, roles: ['SUPER_ADMIN'] },
      { href: '/admin/journal', label: 'Journal activité', icon: ScrollText, roles: ['SUPER_ADMIN'] },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role ?? 'VENDEUR') as Role

  // Pas de sidebar sur les pages d'authentification
  const authPages = ['/admin/login', '/admin/changer-mot-de-passe']
  if (authPages.includes(pathname)) return null

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    // Éviter que /admin/commissions soit actif quand on est sur /admin/commissions/vendeur
    if (href === '/admin/commissions') return pathname === '/admin/commissions'
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

  const filteredGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="w-56 bg-blue-teralite min-h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href="/admin">
          <span className="text-white font-semibold text-lg tracking-wide">Teralite</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {filteredGroups.map((group) => (
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

      {/* Footer — infos utilisateur + déconnexion */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-orange-teralite flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {session?.user?.name ?? 'Administrateur'}
            </p>
            <div className="flex items-center gap-1">
              {role === 'SUPER_ADMIN' && <Shield className="w-2.5 h-2.5 text-orange-teralite" />}
              <p className="text-xs text-white/50 truncate">{role}</p>
            </div>
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
