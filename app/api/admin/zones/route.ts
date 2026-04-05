import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(2).max(100),
  tarif: z.number().int().min(0),
  delaiJours: z.number().int().min(0).max(30).default(2),
  actif: z.boolean().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const zones = await prisma.zoneLivraison.findMany({
      orderBy: { nom: 'asc' },
      include: { _count: { select: { commandes: true } } },
    })
    return NextResponse.json(zones)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const data = schema.parse(await request.json())
    const zone = await prisma.zoneLivraison.create({ data })
    return NextResponse.json(zone, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
