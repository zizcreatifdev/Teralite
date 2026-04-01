'use client'

import { Bell, Search } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface AdminHeaderProps {
  titre: string
  sousTitre?: string
}

export default function AdminHeader({ titre, sousTitre }: AdminHeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-border-main px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-blue-teralite">{titre}</h1>
        {sousTitre && <p className="text-sm text-text-mid mt-0.5">{sousTitre}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-lg border border-border-main flex items-center justify-center text-text-light hover:bg-gray-fond transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-lg border border-border-main flex items-center justify-center text-text-light hover:bg-gray-fond transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>
        <div className="text-right ml-2">
          <p className="text-xs font-medium text-text-main">
            {session?.user?.name ?? 'Admin'}
          </p>
          <p className="text-xs text-text-light">{session?.user?.role ?? ''}</p>
        </div>
      </div>
    </header>
  )
}
