import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/journal'

const schema = z.object({
  montant: z.number().int().positive().optional(), // ajustement possible
  note: z.string().max(500).optional(),
})

// PUT /api/admin/commissions/[id]/payer — marquer une commission comme payée
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const data = schema.parse(body)

    const commission = await prisma.commission.findUnique({ where: { id: params.id } })
    if (!commission) return NextResponse.json({ error: 'Commission introuvable' }, { status: 404 })
    if (commission.statut === 'PAYEE') {
      return NextResponse.json({ error: 'Commission déjà payée' }, { status: 422 })
    }
    if (commission.statut === 'ANNULEE') {
      return NextResponse.json({ error: 'Commission annulée, impossible de la marquer payée' }, { status: 422 })
    }

    const updated = await prisma.commission.update({
      where: { id: params.id },
      data: {
        statut: 'PAYEE',
        montant: data.montant ?? commission.montant,
        notePaiement: data.note ?? null,
        payeeLe: new Date(),
      },
      include: {
        vendeur: { select: { id: true, nom: true, email: true } },
        commande: { select: { numero: true, montantTotal: true } },
      },
    })

    await logAction(session.user.id, 'COMMISSION_PAYEE', {
      commissionId: params.id,
      vendeurId: commission.vendeurId,
      montant: updated.montant,
      note: data.note,
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
