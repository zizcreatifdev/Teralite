import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/commandes — liste avec filtres
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statut = searchParams.get('statut')
  const typePaiement = searchParams.get('typePaiement')
  const dateDebut = searchParams.get('dateDebut')
  const dateFin = searchParams.get('dateFin')
  const recherche = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}
    if (statut) where.statut = statut
    if (typePaiement) where.typePaiement = typePaiement
    if (dateDebut || dateFin) {
      where.createdAt = {}
      if (dateDebut) where.createdAt.gte = new Date(dateDebut)
      if (dateFin) {
        const fin = new Date(dateFin)
        fin.setHours(23, 59, 59, 999)
        where.createdAt.lte = fin
      }
    }
    if (recherche) {
      where.OR = [
        { numero: { contains: recherche, mode: 'insensitive' } },
        { client: { nom: { contains: recherche, mode: 'insensitive' } } },
        { client: { telephone: { contains: recherche } } },
      ]
    }

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: {
          client: { select: { nom: true, telephone: true } },
          zone: { select: { nom: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commande.count({ where }),
    ])

    return NextResponse.json({ commandes, total, pages: Math.ceil(total / limit), page })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
