import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')
  const typePaiement = searchParams.get('typePaiement')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (debut) where.date = { ...where.date, gte: new Date(debut) }
    if (fin) where.date = { ...where.date, lte: new Date(fin + 'T23:59:59') }
    if (typePaiement) where.typePaiement = typePaiement

    const [recettes, total, aggregate] = await Promise.all([
      prisma.recette.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recette.count({ where }),
      prisma.recette.aggregate({ where, _sum: { montant: true } }),
    ])

    return NextResponse.json({
      recettes,
      total,
      pages: Math.ceil(total / limit),
      totalMontant: aggregate._sum.montant ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
