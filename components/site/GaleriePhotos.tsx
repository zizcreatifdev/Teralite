'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Photo {
  id: string
  url: string
  estPrincipale: boolean
}

interface GaleriePhotosProps {
  photos: Photo[]
  nom: string
}

export default function GaleriePhotos({ photos, nom }: GaleriePhotosProps) {
  const [active, setActive] = useState(0)
  const displayed = photos.slice(0, 5)

  if (displayed.length === 0) {
    return (
      <div className="bg-gray-fond rounded-xl h-80 flex items-center justify-center">
        <svg className="w-16 h-16 text-border-main" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Image principale */}
      <div className="relative rounded-xl overflow-hidden bg-gray-fond aspect-square">
        <Image
          src={displayed[active].url}
          alt={nom}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Miniatures */}
      {displayed.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayed.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-blue-teralite' : 'border-border-main hover:border-blue-teralite/40'
              }`}
            >
              <Image src={photo.url} alt={`${nom} ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
