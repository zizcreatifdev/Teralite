import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  taux: z.number().min(0).max(100).optional().nullable(),
  montantFixe: z.number().int().min(0).optional().nullable(),
  dateEffet: z.string().datetime().optional(),
}).refine(
  (d) => d.taux != null || d.montantFixe != null,
  { message: 'Au moins un taux ou un montant fixe est requis' }
)

// GET /api/admin/commissions/config — configuration actuelle + historique
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const [actuelle, historique] = await Promise.all([
      prisma.configCommission.findFirst({
        where: { actif: true },
        orderBy: { dateEffet: 'desc' },
      }),
      prisma.configCommission.findMany({
        orderBy: { dateEffet: 'desc' },
        take: 20,
      }),
    ])

    return NextResponse.json({ actuelle, historique })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/commissions/config — créer une nouvelle configuration
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const data = schema.parse(body)

    // Désactiver toutes les configs actuelles
    await prisma.configCommission.updateMany({
      where: { actif: true },
      data: { actif: false },
    })

    // Créer la nouvelle config
    const nouvelleConfig = await prisma.configCommission.create({
      data: {
        taux: data.taux ?? null,
        montantFixe: data.montantFixe ?? null,
        actif: true,
        dateEffet: data.dateEffet ? new Date(data.dateEffet) : new Date(),
      },
    })

    return NextResponse.json(nouvelleConfig, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
