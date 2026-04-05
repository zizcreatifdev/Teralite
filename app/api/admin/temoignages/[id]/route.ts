import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(2).max(100).optional(),
  role: z.string().min(2).max(100).optional(),
  texte: z.string().min(10).max(500).optional(),
  note: z.number().int().min(1).max(5).optional(),
  ordre: z.number().int().optional(),
  actif: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const data = schema.parse(await request.json())
    const t = await prisma.temoignage.update({ where: { id: params.id }, data })
    return NextResponse.json(t)
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    await prisma.temoignage.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
