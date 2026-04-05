import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const TAILLE_MAX = 5 * 1024 * 1024 // 5 MB
const TYPES_AUTORISÉS = ['image/jpeg', 'image/png', 'image/webp']
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// POST /api/admin/upload — upload d'une photo produit
// Note : stockage local dans /public/uploads/produits/
// En production Vercel, remplacer par Supabase Storage (Phase 6)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const formData = await request.formData()
    const fichier = formData.get('fichier') as File | null

    if (!fichier) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!TYPES_AUTORISÉS.includes(fichier.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      )
    }

    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 MB)' }, { status: 400 })
    }

    const extension = EXTENSIONS[fichier.type]
    const nomFichier = `${randomUUID()}.${extension}`
    const dossier = join(process.cwd(), 'public', 'uploads', 'produits')

    // Créer le dossier si absent
    await mkdir(dossier, { recursive: true })

    const buffer = Buffer.from(await fichier.arrayBuffer())
    await writeFile(join(dossier, nomFichier), buffer)

    const url = `/uploads/produits/${nomFichier}`
    return NextResponse.json({ url }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
