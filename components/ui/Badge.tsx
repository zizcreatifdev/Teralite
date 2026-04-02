import type { TypeProduit } from '@prisma/client'

const statutConfig: Record<TypeProduit, { label: string; className: string }> = {
  DISPONIBLE: { label: 'Disponible', className: 'bg-green-light text-green-teralite' },
  RUPTURE:    { label: 'Rupture de stock', className: 'bg-red-light text-red-teralite' },
  BIENTOT:    { label: 'Bientôt disponible', className: 'bg-orange-light text-orange-dark' },
}

export function BadgeProduit({ statut }: { statut: TypeProduit }) {
  const config = statutConfig[statut]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function BadgeVedette() {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-teralite text-white">
      ★ Vedette
    </span>
  )
}
