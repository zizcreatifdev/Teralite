import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')
  const type = searchParams.get('type') // 'recette' | 'depense' | null

  try {
    const dateWhere = {
      gte: debut ? new Date(debut) : undefined,
      lte: fin ? new Date(fin + 'T23:59:59') : undefined,
    }

    const [recettes, depenses] = await Promise.all([
      type === 'depense' ? [] : prisma.recette.findMany({
        where: { date: dateWhere },
        orderBy: { date: 'asc' },
      }),
      type === 'recette' ? [] : prisma.depense.findMany({
        where: { date: dateWhere },
        orderBy: { date: 'asc' },
      }),
    ])

    type EntreeJournal = {
      id: string
      date: Date
      type: 'recette' | 'depense'
      categorie: string
      description: string
      montant: number
    }

    const entrees: EntreeJournal[] = [
      ...recettes.map((r) => ({
        id: r.id,
        date: r.date,
        type: 'recette' as const,
        categorie: r.typePaiement ?? 'Vente',
        description: r.description,
        montant: r.montant,
      })),
      ...depenses.map((d) => ({
        id: d.id,
        date: d.date,
        type: 'depense' as const,
        categorie: d.categorie,
        description: d.description,
        montant: d.montant,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calcul solde cumulé
    let solde = 0
    const journal = entrees.map((e) => {
      solde += e.type === 'recette' ? e.montant : -e.montant
      return { ...e, soldeCumule: solde }
    })

    // Retourner en ordre chronologique inverse pour affichage
    return NextResponse.json({ journal: journal.reverse() })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
