import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(2).max(100).optional(),
  tarif: z.number().int().min(0).optional(),
  delaiJours: z.number().int().min(0).max(30).optional(),
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
    const zone = await prisma.zoneLivraison.update({ where: { id: params.id }, data })
    return NextResponse.json(zone)
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
    // Vérifier que la zone n'a pas de commandes
    const zone = await prisma.zoneLivraison.findUnique({
      where: { id: params.id },
      include: { _count: { select: { commandes: true } } },
    })
    if (!zone) return NextResponse.json({ error: 'Zone introuvable' }, { status: 404 })
    if (zone._count.commandes > 0) {
      return NextResponse.json(
        { error: 'Cette zone a des commandes associées, désactivez-la plutôt que de la supprimer' },
        { status: 409 }
      )
    }
    await prisma.zoneLivraison.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
