import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get('page') ?? '1')
  const q = searchParams.get('q') ?? ''
  const limit = 30

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (q) where.numero = { contains: q, mode: 'insensitive' }

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          commande: {
            select: {
              numero: true,
              client: { select: { nom: true } },
            },
          },
          devis: {
            select: {
              numero: true,
              client: { select: { nom: true } },
            },
          },
        },
      }),
      prisma.facture.count({ where }),
    ])

    return NextResponse.json({ factures, total, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
