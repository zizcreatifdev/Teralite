import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaUpdate = z.object({
  notes: z.string().optional().nullable(),
})

// GET /api/admin/commandes/[id] — détail complet
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const commande = await prisma.commande.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        vendeur: { select: { id: true, nom: true, email: true } },
        zone: true,
        lignes: {
          include: {
            produit: {
              include: { photos: { where: { estPrincipale: true }, take: 1 } },
            },
          },
        },
        historique: { orderBy: { createdAt: 'asc' } },
        commission: { include: { vendeur: { select: { nom: true } } } },
        facture: true,
      },
    })

    if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    return NextResponse.json(commande)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/commandes/[id] — mettre à jour les notes internes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const { notes } = schemaUpdate.parse(body)

    const commande = await prisma.commande.update({
      where: { id: params.id },
      data: { notes },
    })

    return NextResponse.json(commande)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
