import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(3).max(50).toUpperCase().optional(),
  type: z.enum(['POURCENTAGE', 'MONTANT_FIXE']).optional(),
  valeur: z.number().positive().optional(),
  expiration: z.string().datetime().optional().nullable(),
  usageMax: z.number().int().positive().optional().nullable(),
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
    const promo = await prisma.codePromo.update({
      where: { id: params.id },
      data: {
        ...data,
        expiration: data.expiration ? new Date(data.expiration) : data.expiration,
      },
    })
    return NextResponse.json(promo)
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
    await prisma.codePromo.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
