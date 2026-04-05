import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaCreate = z.object({
  categorie: z.enum(['STOCK', 'TRANSPORT', 'MARKETING', 'FRAIS_DIVERS']),
  description: z.string().min(2).max(500),
  montant: z.number().int().positive(),
  date: z.string().datetime().optional(),
  justificatif: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')
  const categorie = searchParams.get('categorie')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (debut) where.date = { ...where.date, gte: new Date(debut) }
    if (fin) where.date = { ...where.date, lte: new Date(fin + 'T23:59:59') }
    if (categorie) where.categorie = categorie

    const [depenses, total, aggregate] = await Promise.all([
      prisma.depense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.depense.count({ where }),
      prisma.depense.aggregate({ where, _sum: { montant: true } }),
    ])

    return NextResponse.json({
      depenses,
      total,
      pages: Math.ceil(total / limit),
      totalMontant: aggregate._sum.montant ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json() as unknown
    const data = schemaCreate.parse(body)
    const depense = await prisma.depense.create({
      data: {
        categorie: data.categorie,
        description: data.description,
        montant: data.montant,
        date: data.date ? new Date(data.date) : new Date(),
        justificatif: data.justificatif ?? null,
      },
    })
    return NextResponse.json(depense, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
