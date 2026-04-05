import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parsePeriode(searchParams: URLSearchParams): { debut: Date; fin: Date } {
  const type = searchParams.get('periode') ?? 'mois'
  const now = new Date()

  if (type === 'personnalise') {
    const debut = searchParams.get('debut')
    const fin = searchParams.get('fin')
    return {
      debut: debut ? new Date(debut) : new Date(now.getFullYear(), now.getMonth(), 1),
      fin: fin ? new Date(fin + 'T23:59:59') : now,
    }
  }

  if (type === 'mois_dernier') {
    const debut = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const fin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { debut, fin }
  }

  if (type === 'trimestre') {
    const debut = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return { debut, fin: now }
  }

  if (type === 'annee') {
    const debut = new Date(now.getFullYear(), 0, 1)
    return { debut, fin: now }
  }

  // mois courant (default)
  const debut = new Date(now.getFullYear(), now.getMonth(), 1)
  return { debut, fin: now }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { debut, fin } = parsePeriode(request.nextUrl.searchParams)

  try {
    const [recettes, depenses, recettesMois] = await Promise.all([
      prisma.recette.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { montant: true },
        _count: true,
      }),
      prisma.depense.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { montant: true },
        _count: true,
      }),
      // Évolution sur 12 mois pour le graphique
      prisma.recette.findMany({
        where: {
          date: {
            gte: new Date(new Date().getFullYear() - 1, new Date().getMonth() + 1, 1),
          },
        },
        select: { montant: true, date: true },
        orderBy: { date: 'asc' },
      }),
    ])

    const ca = recettes._sum.montant ?? 0
    const totalDepenses = depenses._sum.montant ?? 0
    const benefice = ca - totalDepenses
    const marge = ca > 0 ? Math.round((benefice / ca) * 100) : 0

    // Regrouper par mois
    const evolutionMap: Record<string, { recettes: number; depenses: number }> = {}
    recettesMois.forEach((r) => {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`
      if (!evolutionMap[key]) evolutionMap[key] = { recettes: 0, depenses: 0 }
      evolutionMap[key].recettes += r.montant
    })

    const depensesMois = await prisma.depense.findMany({
      where: {
        date: {
          gte: new Date(new Date().getFullYear() - 1, new Date().getMonth() + 1, 1),
        },
      },
      select: { montant: true, date: true },
    })
    depensesMois.forEach((d) => {
      const key = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}`
      if (!evolutionMap[key]) evolutionMap[key] = { recettes: 0, depenses: 0 }
      evolutionMap[key].depenses += d.montant
    })

    const evolution = Object.entries(evolutionMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, vals]) => ({
        mois,
        recettes: vals.recettes,
        depenses: vals.depenses,
        benefice: vals.recettes - vals.depenses,
      }))

    // Répartition dépenses par catégorie sur la période
    const repartitionRaw = await prisma.depense.groupBy({
      by: ['categorie'],
      where: { date: { gte: debut, lte: fin } },
      _sum: { montant: true },
    })
    const repartitionDepenses = repartitionRaw.map((r) => ({
      categorie: r.categorie,
      montant: r._sum.montant ?? 0,
    }))

    return NextResponse.json({
      ca,
      depenses: totalDepenses,
      benefice,
      marge,
      nbRecettes: recettes._count,
      nbDepenses: depenses._count,
      evolution,
      repartitionDepenses,
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
