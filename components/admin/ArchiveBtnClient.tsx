'use client'

import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ArchiveBtnClient({ produitId }: { produitId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const archiver = async () => {
    if (!confirm('Archiver ce produit ? Il ne sera plus visible dans le catalogue.')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/produits/${produitId}/archiver`, { method: 'PUT' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={archiver}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-text-light hover:text-red-teralite hover:bg-red-light px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      <Archive className="w-3 h-3" />
      {loading ? '…' : 'Archiver'}
    </button>
  )
}
