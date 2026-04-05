import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/commissions/vendeur — données propres au vendeur connecté
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // N'importe quel rôle peut accéder mais ne voit que ses propres données
  const vendeurId = session.user.id

  const { searchParams } = request.nextUrl
  const annee = parseInt(searchParams.get('annee') ?? String(new Date().getFullYear()))
  const mois = parseInt(searchParams.get('mois') ?? String(new Date().getMonth() + 1))

  const debutMois = new Date(annee, mois - 1, 1)
  const finMois = new Date(annee, mois, 0, 23, 59, 59)

  try {
    const [commissionsMois, historique, commandesMois] = await Promise.all([
      prisma.commission.findMany({
        where: { vendeurId, createdAt: { gte: debutMois, lte: finMois } },
        include: {
          commande: { select: { numero: true, montantTotal: true, createdAt: true, statut: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commission.findMany({
        where: { vendeurId, statut: 'PAYEE' },
        include: {
          commande: { select: { numero: true, montantTotal: true, createdAt: true } },
        },
        orderBy: { payeeLe: 'desc' },
        take: 24,
      }),
      prisma.commande.findMany({
        where: { vendeurId, createdAt: { gte: debutMois, lte: finMois } },
        select: { montantTotal: true },
      }),
    ])

    const caGenere = commandesMois.reduce((s, c) => s + c.montantTotal, 0)
    const commissionDuMois = commissionsMois
      .filter((c) => c.statut !== 'ANNULEE')
      .reduce((s, c) => s + c.montant, 0)
    const enAttente = commissionsMois
      .filter((c) => c.statut === 'EN_ATTENTE')
      .reduce((s, c) => s + c.montant, 0)

    return NextResponse.json({
      vendeur: { id: vendeurId, nom: session.user.name, email: session.user.email },
      periode: { annee, mois },
      nbVentes: commandesMois.length,
      caGenere,
      commissionDuMois,
      enAttente,
      commissionsMois,
      historique,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
