import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(['POURCENTAGE', 'MONTANT_FIXE']),
  valeur: z.number().positive(),
  expiration: z.string().datetime().optional().nullable(),
  usageMax: z.number().int().positive().optional().nullable(),
  actif: z.boolean().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const promos = await prisma.codePromo.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(promos)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const data = schema.parse(await request.json())

    const existant = await prisma.codePromo.findUnique({ where: { code: data.code } })
    if (existant) return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 409 })

    const promo = await prisma.codePromo.create({
      data: {
        code: data.code,
        type: data.type,
        valeur: data.valeur,
        expiration: data.expiration ? new Date(data.expiration) : null,
        usageMax: data.usageMax ?? null,
        actif: data.actif,
      },
    })
    return NextResponse.json(promo, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
