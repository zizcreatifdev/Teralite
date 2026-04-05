import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaLigne = z.object({
  designation: z.string().min(1),
  produitId: z.string().optional().nullable(),
  quantite: z.number().int().min(1),
  prixUnitaire: z.number().int().min(0),
  remise: z.number().min(0).max(100).default(0),
  tva: z.number().min(0).max(1).default(0),
  sousTotal: z.number().int().min(0),
})

const schemaDevis = z.object({
  clientId: z.string().optional(),
  newClient: z
    .object({
      nom: z.string().min(2),
      telephone: z.string().min(8),
      email: z.string().email().optional().or(z.literal('')),
      adresse: z.string().optional(),
      type: z.enum(['PARTICULIER', 'ENTREPRISE', 'MUNICIPALITE']).default('PARTICULIER'),
    })
    .optional(),
  lignes: z.array(schemaLigne).min(1),
  conditions: z.string().optional(),
  validiteJours: z.number().int().min(1).max(365).default(30),
  notes: z.string().optional(),
})

// GET /api/admin/devis — liste avec filtres
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statut = searchParams.get('statut')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (statut) where.statut = statut
  if (q) {
    where.OR = [
      { numero: { contains: q, mode: 'insensitive' } },
      { client: { nom: { contains: q, mode: 'insensitive' } } },
    ]
  }

  try {
    const [devis, total] = await Promise.all([
      prisma.devis.findMany({
        where,
        include: {
          client: { select: { nom: true, telephone: true } },
          lignes: { select: { sousTotal: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.devis.count({ where }),
    ])

    return NextResponse.json({ devis, total, pages: Math.ceil(total / limit), page })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/devis — créer un devis
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaDevis.parse(body)

    if (!data.clientId && !data.newClient) {
      return NextResponse.json({ error: 'Client requis' }, { status: 400 })
    }

    // Générer le numéro DEV-YYYY-NNN
    const annee = new Date().getFullYear()
    const count = await prisma.devis.count()
    const numero = `DEV-${annee}-${String(count + 1).padStart(3, '0')}`

    let clientId = data.clientId!
    if (data.newClient) {
      const client = await prisma.client.create({
        data: {
          nom: data.newClient.nom,
          telephone: data.newClient.telephone,
          email: data.newClient.email || null,
          adresse: data.newClient.adresse,
          type: data.newClient.type,
        },
      })
      clientId = client.id
    }

    const devis = await prisma.devis.create({
      data: {
        numero,
        clientId,
        conditions: data.conditions,
        validiteJours: data.validiteJours,
        notes: data.notes,
        lignes: {
          create: data.lignes.map((l) => ({
            designation: l.designation,
            produitId: l.produitId || null,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            remise: l.remise,
            tva: l.tva,
            sousTotal: l.sousTotal,
          })),
        },
      },
      include: { client: true, lignes: true },
    })

    return NextResponse.json(devis, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
