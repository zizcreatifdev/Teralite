import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/journal — journal d'activité filtré
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const utilisateurId = searchParams.get('utilisateurId')
  const action = searchParams.get('action')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (utilisateurId) where.utilisateurId = utilisateurId
    if (action) where.action = { contains: action, mode: 'insensitive' }

    const [entrees, total] = await Promise.all([
      prisma.journalActivite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        },
      }),
      prisma.journalActivite.count({ where }),
    ])

    return NextResponse.json({ entrees, total, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
