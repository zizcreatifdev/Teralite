import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const schemaUpdate = z.object({
  nom: z.string().min(2).max(200).optional(),
  reference: z.string().min(1).max(50).optional(),
  categorie: z.string().min(1).max(100).optional(),
  descriptionCourte: z.string().min(1).max(500).optional(),
  descriptionLongue: z.string().optional().nullable(),
  specifications: z
    .array(z.object({ label: z.string(), valeur: z.string() }))
    .optional(),
  prixPublic: z.number().int().positive().optional().nullable(),
  prixDevis: z.number().int().positive().optional().nullable(),
  tva: z.number().min(0).max(1).optional(),
  stock: z.number().int().min(0).optional(),
  seuilAlerte: z.number().int().min(0).optional(),
  statut: z.enum(['DISPONIBLE', 'RUPTURE', 'BIENTOT']).optional(),
  estVedette: z.boolean().optional(),
  photos: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        estPrincipale: z.boolean().default(false),
        ordre: z.number().int().default(0),
      })
    )
    .optional(),
})

// GET /api/admin/produits/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const produit = await prisma.produit.findUnique({
      where: { id: params.id },
      include: { photos: { orderBy: { ordre: 'asc' } } },
    })
    if (!produit) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    return NextResponse.json(produit)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/produits/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaUpdate.parse(body)

    const existant = await prisma.produit.findUnique({ where: { id: params.id } })
    if (!existant) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

    const { photos, nom, ...champs } = data

    // Recalculer le slug si le nom change
    let slug = existant.slug
    if (nom && nom !== existant.nom) {
      slug = slugify(nom)
      const conflit = await prisma.produit.findFirst({
        where: { slug, id: { not: params.id } },
      })
      if (conflit) slug = slug + '-' + Date.now()
    }

    // Reconstruire les photos : supprimer les anciennes, insérer les nouvelles
    if (photos !== undefined) {
      await prisma.photo.deleteMany({ where: { produitId: params.id } })
    }

    const produit = await prisma.produit.update({
      where: { id: params.id },
      data: {
        ...champs,
        ...(nom ? { nom, slug } : {}),
        ...(data.specifications !== undefined
          ? { specifications: data.specifications }
          : {}),
        ...(photos !== undefined
          ? {
              photos: {
                create: photos.map((p, i) => ({
                  url: p.url,
                  estPrincipale: p.estPrincipale,
                  ordre: i,
                })),
              },
            }
          : {}),
      },
      include: { photos: { orderBy: { ordre: 'asc' } } },
    })

    return NextResponse.json(produit)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
