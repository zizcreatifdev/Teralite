import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  texte: z.string().min(10).max(500),
  note: z.number().int().min(1).max(5).default(5),
  ordre: z.number().int().default(0),
  actif: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const data = schema.parse(await request.json())
    const temoignage = await prisma.temoignage.create({ data })
    return NextResponse.json(temoignage, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
