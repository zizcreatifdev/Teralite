'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Upload, Star, StarOff, Plus, Trash2 } from 'lucide-react'

interface PhotoItem {
  id?: string
  url: string
  file?: File
  preview?: string
  estPrincipale: boolean
  ordre: number
}

interface Spec { label: string; valeur: string }

interface ProduitInitial {
  id?: string
  nom: string
  reference: string
  categorie: string
  descriptionCourte: string
  descriptionLongue: string
  prixPublic: number | null
  prixDevis: number | null
  tva: number
  stock: number
  seuilAlerte: number
  statut: 'DISPONIBLE' | 'RUPTURE' | 'BIENTOT'
  estVedette: boolean
  specifications: Spec[]
  photos: PhotoItem[]
}

const VIDE: ProduitInitial = {
  nom: '', reference: '', categorie: '', descriptionCourte: '', descriptionLongue: '',
  prixPublic: null, prixDevis: null, tva: 0, stock: 0, seuilAlerte: 5,
  statut: 'DISPONIBLE', estVedette: false, specifications: [], photos: [],
}

export default function ProduitForm({ initial = VIDE }: { initial?: ProduitInitial }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const [nom, setNom] = useState(initial.nom)
  const [reference, setReference] = useState(initial.reference)
  const [categorie, setCategorie] = useState(initial.categorie)
  const [descCourte, setDescCourte] = useState(initial.descriptionCourte)
  const [descLongue, setDescLongue] = useState(initial.descriptionLongue)
  const [prixPublic, setPrixPublic] = useState<string>(initial.prixPublic ? String(initial.prixPublic) : '')
  const [prixDevis, setPrixDevis] = useState<string>(initial.prixDevis ? String(initial.prixDevis) : '')
  const [tva, setTva] = useState<string>(String(initial.tva * 100))
  const [stock, setStock] = useState<string>(String(initial.stock))
  const [seuilAlerte, setSeuilAlerte] = useState<string>(String(initial.seuilAlerte))
  const [statut, setStatut] = useState<'DISPONIBLE' | 'RUPTURE' | 'BIENTOT'>(initial.statut)
  const [estVedette, setEstVedette] = useState(initial.estVedette)
  const [specs, setSpecs] = useState<Spec[]>(initial.specifications)
  const [photos, setPhotos] = useState<PhotoItem[]>(initial.photos)

  // ——— Gestion des photos ———
  const ajouterPhotos = (fichiers: FileList) => {
    const restant = 5 - photos.length
    if (restant <= 0) return
    const nouvelles: PhotoItem[] = []
    for (let i = 0; i < Math.min(fichiers.length, restant); i++) {
      const f = fichiers[i]
      const preview = URL.createObjectURL(f)
      nouvelles.push({ file: f, url: '', preview, estPrincipale: photos.length + i === 0, ordre: photos.length + i })
    }
    setPhotos((prev) => {
      const merged = [...prev, ...nouvelles]
      // S'assurer qu'il y a toujours une photo principale
      if (!merged.some((p) => p.estPrincipale) && merged.length > 0) {
        merged[0].estPrincipale = true
      }
      return merged
    })
  }

  const supprimerPhoto = (idx: number) => {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length > 0 && !next.some((p) => p.estPrincipale)) {
        next[0].estPrincipale = true
      }
      return next
    })
  }

  const setPhotoPrincipale = (idx: number) => {
    setPhotos((prev) => prev.map((p, i) => ({ ...p, estPrincipale: i === idx })))
  }

  // ——— Gestion des spécifications ———
  const ajouterSpec = () => setSpecs((prev) => [...prev, { label: '', valeur: '' }])
  const supprimerSpec = (idx: number) => setSpecs((prev) => prev.filter((_, i) => i !== idx))
  const updateSpec = (idx: number, champ: keyof Spec, val: string) => {
    setSpecs((prev) => prev.map((s, i) => i === idx ? { ...s, [champ]: val } : s))
  }

  // ——— Upload et sauvegarde ———
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErreur(null)

    try {
      // 1. Uploader les nouvelles photos
      const photosFinales: { url: string; estPrincipale: boolean; ordre: number }[] = []
      for (const photo of photos) {
        if (photo.file) {
          const fd = new FormData()
          fd.append('fichier', photo.file)
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('Erreur upload photo')
          const { url } = await res.json() as { url: string }
          photosFinales.push({ url, estPrincipale: photo.estPrincipale, ordre: photo.ordre })
        } else if (photo.url) {
          photosFinales.push({ url: photo.url, estPrincipale: photo.estPrincipale, ordre: photo.ordre })
        }
      }

      // 2. Sauvegarder le produit
      const payload = {
        nom,
        reference,
        categorie,
        descriptionCourte: descCourte,
        descriptionLongue: descLongue || null,
        prixPublic: prixPublic ? parseInt(prixPublic) : null,
        prixDevis: prixDevis ? parseInt(prixDevis) : null,
        tva: parseFloat(tva) / 100,
        stock: parseInt(stock) || 0,
        seuilAlerte: parseInt(seuilAlerte) || 5,
        statut,
        estVedette,
        specifications: specs.filter((s) => s.label && s.valeur),
        photos: photosFinales,
      }

      const url = initial.id
        ? `/api/admin/produits/${initial.id}`
        : '/api/admin/produits'
      const method = initial.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde')
      }

      router.push('/admin/produits')
      router.refresh()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {erreur && (
        <div className="bg-red-light border border-red-teralite/30 text-red-teralite text-sm rounded-xl px-4 py-3">
          {erreur}
        </div>
      )}

      {/* Infos générales */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-main">Informations générales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Nom *</label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
              placeholder="ex: Lampe LED Solaire 30W"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Référence *</label>
            <input
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-teralite"
              placeholder="ex: TRL-SOL-030"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Catégorie *</label>
            <input
              required
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
              placeholder="ex: Lampes solaires"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as typeof statut)}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="RUPTURE">Rupture de stock</option>
              <option value="BIENTOT">Bientôt disponible</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-mid mb-1">Description courte *</label>
          <textarea
            required
            value={descCourte}
            onChange={(e) => setDescCourte(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none"
            placeholder="Description affichée dans le catalogue (max 500 caractères)"
          />
          <p className="text-xs text-text-light text-right mt-0.5">{descCourte.length}/500</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-mid mb-1">Description longue</label>
          <textarea
            value={descLongue}
            onChange={(e) => setDescLongue(e.target.value)}
            rows={5}
            className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-y"
            placeholder="Description complète affichée sur la fiche produit"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setEstVedette((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${estVedette ? 'bg-orange-teralite' : 'bg-border-main'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${estVedette ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-text-main">Produit vedette</span>
          {estVedette ? <Star className="w-4 h-4 text-orange-teralite" /> : <StarOff className="w-4 h-4 text-text-light" />}
        </label>
      </div>

      {/* Prix & stock */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-main">Prix & Stock</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Prix public (F)</label>
            <input
              type="number"
              value={prixPublic}
              onChange={(e) => setPrixPublic(e.target.value)}
              min={0}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
              placeholder="Laisser vide → sur devis"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Prix devis (F)</label>
            <input
              type="number"
              value={prixDevis}
              onChange={(e) => setPrixDevis(e.target.value)}
              min={0}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">TVA (%)</label>
            <input
              type="number"
              value={tva}
              onChange={(e) => setTva(e.target.value)}
              min={0}
              max={100}
              step={0.1}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min={0}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-mid mb-1">Seuil d&apos;alerte</label>
            <input
              type="number"
              value={seuilAlerte}
              onChange={(e) => setSeuilAlerte(e.target.value)}
              min={0}
              className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
            />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Photos ({photos.length}/5)</h2>
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-blue-teralite hover:bg-blue-light px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Ajouter des photos
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && ajouterPhotos(e.target.files)}
        />

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border-main rounded-xl py-10 flex flex-col items-center gap-2 text-text-light hover:border-blue-teralite hover:text-blue-teralite transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">Cliquez pour ajouter des photos (max 5, 5 MB chacune)</span>
            <span className="text-xs">JPEG · PNG · WebP</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${photo.estPrincipale ? 'border-blue-teralite' : 'border-border-main'}`}>
                <div className="relative aspect-square">
                  <Image
                    src={photo.preview ?? photo.url}
                    alt={`Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={!!photo.preview}
                  />
                </div>
                {photo.estPrincipale && (
                  <span className="absolute bottom-1 left-1 text-xs bg-blue-teralite text-white px-1.5 py-0.5 rounded font-medium">
                    Principale
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!photo.estPrincipale && (
                    <button
                      type="button"
                      onClick={() => setPhotoPrincipale(idx)}
                      className="bg-white rounded-full p-1.5 text-blue-teralite hover:bg-blue-light"
                      title="Définir comme principale"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => supprimerPhoto(idx)}
                    className="bg-white rounded-full p-1.5 text-red-teralite hover:bg-red-light"
                    title="Supprimer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border-main flex items-center justify-center text-text-light hover:border-blue-teralite hover:text-blue-teralite transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spécifications techniques */}
      <div className="bg-white rounded-xl border border-border-main p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Spécifications techniques</h2>
          <button
            type="button"
            onClick={ajouterSpec}
            className="flex items-center gap-1.5 text-sm text-blue-teralite hover:bg-blue-light px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        {specs.length === 0 ? (
          <p className="text-sm text-text-light">Aucune spécification. Cliquez sur Ajouter.</p>
        ) : (
          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={spec.label}
                  onChange={(e) => updateSpec(idx, 'label', e.target.value)}
                  placeholder="Caractéristique (ex: Puissance)"
                  className="flex-1 border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
                />
                <input
                  value={spec.valeur}
                  onChange={(e) => updateSpec(idx, 'valeur', e.target.value)}
                  placeholder="Valeur (ex: 30W)"
                  className="flex-1 border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite"
                />
                <button
                  type="button"
                  onClick={() => supprimerSpec(idx)}
                  className="p-2 text-text-light hover:text-red-teralite transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-teralite text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : (initial.id ? 'Enregistrer les modifications' : 'Créer le produit')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-text-mid border border-border-main px-5 py-2.5 rounded-lg hover:bg-gray-fond transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
