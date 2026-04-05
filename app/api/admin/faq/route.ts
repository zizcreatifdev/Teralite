import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  question: z.string().min(5).max(300),
  reponse: z.string().min(10).max(2000),
  categorie: z.string().min(2).max(100),
  ordre: z.number().int().default(0),
  actif: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const data = schema.parse(await request.json())
    const faq = await prisma.fAQ.create({ data })
    return NextResponse.json(faq, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
