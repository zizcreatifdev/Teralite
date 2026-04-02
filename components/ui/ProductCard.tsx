import Link from 'next/link'
import Image from 'next/image'
import { formatFCFA } from '@/lib/utils'
import { BadgeProduit, BadgeVedette } from '@/components/ui/Badge'
import type { TypeProduit } from '@prisma/client'

interface ProductCardProps {
  slug: string
  nom: string
  categorie: string
  descriptionCourte: string
  prixPublic: number | null
  statut: TypeProduit
  estVedette: boolean
  photoUrl?: string | null
}

export default function ProductCard({
  slug,
  nom,
  categorie,
  descriptionCourte,
  prixPublic,
  statut,
  estVedette,
  photoUrl,
}: ProductCardProps) {
  return (
    <Link
      href={`/produits/${slug}`}
      className="group bg-white rounded-xl border border-border-main overflow-hidden shadow-sm hover:shadow-md hover:border-blue-teralite/30 transition-all flex flex-col"
    >
      {/* Image */}
      <div className="relative bg-gray-fond h-52 overflow-hidden flex-shrink-0">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={nom}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-border-main" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        )}
        {/* Badges superposés */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {estVedette && <BadgeVedette />}
          {statut !== 'DISPONIBLE' && <BadgeProduit statut={statut} />}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-orange-teralite uppercase tracking-wider mb-1">
          {categorie}
        </p>
        <h3 className="font-semibold text-text-main mb-2 leading-snug group-hover:text-blue-teralite transition-colors">
          {nom}
        </h3>
        <p className="text-text-mid text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
          {descriptionCourte}
        </p>
        <div className="flex items-center justify-between mt-auto">
          {prixPublic ? (
            <p className="text-lg font-semibold text-blue-teralite">
              {formatFCFA(prixPublic)}
            </p>
          ) : (
            <p className="text-sm text-text-light italic">Prix sur devis</p>
          )}
          <span className="text-xs font-medium text-blue-teralite bg-blue-light px-3 py-1.5 rounded-lg group-hover:bg-blue-teralite group-hover:text-white transition-colors">
            Voir →
          </span>
        </div>
      </div>
    </Link>
  )
}
