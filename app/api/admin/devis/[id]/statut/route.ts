import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { StatutDevis } from '@prisma/client'

const schema = z.object({ statut: z.nativeEnum(StatutDevis) })

const TRANSITIONS: Record<StatutDevis, StatutDevis[]> = {
  NOUVEAU: ['EN_COURS', 'ENVOYE', 'REFUSE'],
  EN_COURS: ['ENVOYE', 'REFUSE'],
  ENVOYE: ['ACCEPTE', 'REFUSE', 'EN_COURS'],
  ACCEPTE: ['REFUSE'],
  REFUSE: [],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { statut } = schema.parse(await request.json())

    const devis = await prisma.devis.findUnique({ where: { id: params.id } })
    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    if (!TRANSITIONS[devis.statut].includes(statut)) {
      return NextResponse.json(
        { error: `Transition ${devis.statut} → ${statut} non autorisée` },
        { status: 422 }
      )
    }

    const updated = await prisma.devis.update({
      where: { id: params.id },
      data: { statut },
    })
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
