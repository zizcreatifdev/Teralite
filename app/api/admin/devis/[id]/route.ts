import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaUpdate = z.object({
  conditions: z.string().optional().nullable(),
  validiteJours: z.number().int().min(1).max(365).optional(),
  notes: z.string().optional().nullable(),
  lignes: z
    .array(
      z.object({
        id: z.string().optional(),
        designation: z.string().min(1),
        produitId: z.string().optional().nullable(),
        quantite: z.number().int().min(1),
        prixUnitaire: z.number().int().min(0),
        remise: z.number().min(0).max(100).default(0),
        tva: z.number().min(0).max(1).default(0),
        sousTotal: z.number().int().min(0),
      })
    )
    .optional(),
})

// GET /api/admin/devis/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        vendeur: { select: { id: true, nom: true } },
        lignes: {
          include: { produit: { select: { id: true, nom: true, reference: true, prixDevis: true } } },
          orderBy: { id: 'asc' },
        },
        facture: true,
      },
    })
    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    return NextResponse.json(devis)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/devis/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaUpdate.parse(body)

    const existant = await prisma.devis.findUnique({ where: { id: params.id } })
    if (!existant) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    // Reconstruire les lignes si fournies
    if (data.lignes !== undefined) {
      await prisma.ligneDevis.deleteMany({ where: { devisId: params.id } })
    }

    const devis = await prisma.devis.update({
      where: { id: params.id },
      data: {
        conditions: data.conditions,
        validiteJours: data.validiteJours,
        notes: data.notes,
        ...(data.lignes !== undefined
          ? {
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
            }
          : {}),
      },
      include: { client: true, lignes: { include: { produit: { select: { nom: true, reference: true } } } }, facture: true },
    })

    return NextResponse.json(devis)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
