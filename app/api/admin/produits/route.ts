import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { logAction } from '@/lib/journal'

const schemaProduit = z.object({
  nom: z.string().min(2).max(200),
  reference: z.string().min(1).max(50),
  categorie: z.string().min(1).max(100),
  descriptionCourte: z.string().min(1).max(500),
  descriptionLongue: z.string().optional(),
  specifications: z.array(z.object({ label: z.string(), valeur: z.string() })).optional(),
  prixPublic: z.number().int().positive().optional().nullable(),
  prixDevis: z.number().int().positive().optional().nullable(),
  tva: z.number().min(0).max(1).default(0),
  stock: z.number().int().min(0).default(0),
  seuilAlerte: z.number().int().min(0).default(5),
  statut: z.enum(['DISPONIBLE', 'RUPTURE', 'BIENTOT']).default('DISPONIBLE'),
  estVedette: z.boolean().default(false),
  photos: z
    .array(
      z.object({
        url: z.string(),
        estPrincipale: z.boolean().default(false),
        ordre: z.number().int().default(0),
      })
    )
    .optional(),
})

// GET /api/admin/produits — liste avec filtres
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get('categorie')
  const statut = searchParams.get('statut')
  const archive = searchParams.get('archive') === 'true'
  const recherche = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { archive }
    if (categorie) where.categorie = categorie
    if (statut) where.statut = statut
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche, mode: 'insensitive' } },
        { reference: { contains: recherche, mode: 'insensitive' } },
      ]
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        include: { photos: { where: { estPrincipale: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.produit.count({ where }),
    ])

    // Catégories disponibles pour les filtres
    const categories = await prisma.produit.findMany({
      where: { archive: false },
      select: { categorie: true },
      distinct: ['categorie'],
    })

    return NextResponse.json({
      produits,
      total,
      pages: Math.ceil(total / limit),
      page,
      categories: categories.map((c) => c.categorie),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/produits — créer un produit
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaProduit.parse(body)

    // Générer un slug unique
    let slug = slugify(data.nom)
    const existant = await prisma.produit.findUnique({ where: { slug } })
    if (existant) slug = slug + '-' + Date.now()

    // Vérifier que la référence est unique
    const refExistante = await prisma.produit.findUnique({ where: { reference: data.reference } })
    if (refExistante) {
      return NextResponse.json({ error: 'Cette référence existe déjà' }, { status: 409 })
    }

    const { photos, ...champs } = data

    const produit = await prisma.produit.create({
      data: {
        ...champs,
        slug,
        specifications: champs.specifications ?? [],
        photos: photos?.length
          ? { create: photos.map((p, i) => ({ ...p, ordre: i })) }
          : undefined,
      },
      include: { photos: true },
    })

    await logAction(session.user.id, 'PRODUIT_CREE', { produitId: produit.id, nom: produit.nom })
    return NextResponse.json(produit, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
