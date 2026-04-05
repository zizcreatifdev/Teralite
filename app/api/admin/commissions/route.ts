import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/commissions — résumé par vendeur pour la période
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const vendeurId = searchParams.get('vendeurId')
  const annee = parseInt(searchParams.get('annee') ?? String(new Date().getFullYear()))
  const mois = parseInt(searchParams.get('mois') ?? String(new Date().getMonth() + 1))

  const debut = new Date(annee, mois - 1, 1)
  const fin = new Date(annee, mois, 0, 23, 59, 59)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { createdAt: { gte: debut, lte: fin } }
    if (vendeurId) where.vendeurId = vendeurId

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        vendeur: { select: { id: true, nom: true, email: true } },
        commande: { select: { numero: true, montantTotal: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Regrouper par vendeur
    const parVendeur: Record<string, {
      vendeur: { id: string; nom: string; email: string }
      nbVentes: number
      caGenere: number
      commissionTotale: number
      commissions: typeof commissions
      statuts: { EN_ATTENTE: number; VALIDEE: number; PAYEE: number; ANNULEE: number }
    }> = {}

    for (const c of commissions) {
      const vid = c.vendeur.id
      if (!parVendeur[vid]) {
        parVendeur[vid] = {
          vendeur: c.vendeur,
          nbVentes: 0,
          caGenere: 0,
          commissionTotale: 0,
          commissions: [],
          statuts: { EN_ATTENTE: 0, VALIDEE: 0, PAYEE: 0, ANNULEE: 0 },
        }
      }
      parVendeur[vid].nbVentes++
      parVendeur[vid].caGenere += c.commande.montantTotal
      if (c.statut !== 'ANNULEE') parVendeur[vid].commissionTotale += c.montant
      parVendeur[vid].commissions.push(c)
      parVendeur[vid].statuts[c.statut]++
    }

    return NextResponse.json({
      periode: { annee, mois, debut: debut.toISOString(), fin: fin.toISOString() },
      vendeurs: Object.values(parVendeur),
      total: commissions.length,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
