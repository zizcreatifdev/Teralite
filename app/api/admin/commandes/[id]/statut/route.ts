import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { StatutCommande } from '@prisma/client'

const schema = z.object({
  statut: z.nativeEnum(StatutCommande),
  note: z.string().optional(),
})

// Transitions autorisées
const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  RECUE: ['CONFIRMEE', 'EN_PREPARATION', 'ANNULEE'],
  EN_ATTENTE_PAIEMENT: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['EN_PREPARATION', 'ANNULEE'],
  EN_PREPARATION: ['EXPEDIEE', 'ANNULEE'],
  EXPEDIEE: ['LIVREE', 'ANNULEE'],
  LIVREE: [],
  ANNULEE: [],
}

// PUT /api/admin/commandes/[id]/statut
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const { statut, note } = schema.parse(body)

    const commande = await prisma.commande.findUnique({ where: { id: params.id } })
    if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    const statutsAutorisés = TRANSITIONS[commande.statut]
    if (!statutsAutorisés.includes(statut)) {
      return NextResponse.json(
        { error: `Transition ${commande.statut} → ${statut} non autorisée` },
        { status: 422 }
      )
    }

    const [updated] = await prisma.$transaction([
      prisma.commande.update({
        where: { id: params.id },
        data: { statut },
      }),
      prisma.historiqueStatut.create({
        data: {
          commandeId: params.id,
          statut,
          note: note ?? `Statut mis à jour par ${session.user.name ?? 'admin'}`,
        },
      }),
    ])

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
