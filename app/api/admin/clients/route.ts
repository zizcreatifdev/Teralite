import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaClient = z.object({
  nom: z.string().min(2).max(200),
  telephone: z.string().min(8).max(20),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  adresse: z.string().optional().nullable(),
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'MUNICIPALITE']).default('PARTICULIER'),
  notes: z.string().optional().nullable(),
})

// GET /api/admin/clients
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = parseInt(searchParams.get('limit') ?? '20')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (type) where.type = type
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: 'insensitive' } },
      { telephone: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  try {
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: { select: { commandes: true, devis: true } },
          commandes: { select: { montantTotal: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    const clientsAvecTotal = clients.map((c) => ({
      ...c,
      totalDepense: c.commandes.reduce((s, cmd) => s + cmd.montantTotal, 0),
    }))

    return NextResponse.json({ clients: clientsAvecTotal, total, pages: Math.ceil(total / limit), page })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/clients
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaClient.parse(body)

    const client = await prisma.client.create({
      data: {
        nom: data.nom,
        telephone: data.telephone,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        adresse: data.adresse || null,
        type: data.type,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
