'use client'

import { useRouter, usePathname } from 'next/navigation'

interface CatalogueFiltersProps {
  categories: string[]
  active: string
}

export default function CatalogueFilters({ categories, active }: CatalogueFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleFilter = (cat: string) => {
    const params = cat === 'Tous' ? '' : `?categorie=${encodeURIComponent(cat)}`
    router.push(`${pathname}${params}`)
  }

  const allCats = ['Tous', ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {allCats.map((cat) => (
        <button
          key={cat}
          onClick={() => handleFilter(cat)}
          className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            active === cat
              ? 'bg-blue-teralite text-white'
              : 'bg-white border border-border-main text-text-mid hover:bg-blue-light hover:border-blue-teralite/30 hover:text-blue-teralite'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
