import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')

  try {
    const dateWhere = {
      gte: debut ? new Date(debut) : undefined,
      lte: fin ? new Date(fin + 'T23:59:59') : undefined,
    }

    const [recettes, depenses] = await Promise.all([
      prisma.recette.findMany({ where: { date: dateWhere }, orderBy: { date: 'asc' } }),
      prisma.depense.findMany({ where: { date: dateWhere }, orderBy: { date: 'asc' } }),
    ])

    type RowJournal = {
      Date: string
      Type: string
      Categorie: string
      Description: string
      Montant: number
      'Solde cumulé': number
    }

    const rows: RowJournal[] = []
    let solde = 0

    const entrees = [
      ...recettes.map((r) => ({
        date: r.date,
        type: 'Recette' as const,
        categorie: r.typePaiement ?? 'Vente',
        description: r.description,
        montant: r.montant,
      })),
      ...depenses.map((d) => ({
        date: d.date,
        type: 'Dépense' as const,
        categorie: d.categorie as string,
        description: d.description,
        montant: d.montant,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    for (const e of entrees) {
      solde += e.type === 'Recette' ? e.montant : -e.montant
      rows.push({
        Date: e.date.toLocaleDateString('fr-SN'),
        Type: e.type,
        Categorie: e.categorie,
        Description: e.description,
        Montant: e.montant,
        'Solde cumulé': solde,
      })
    }

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Journal financier')

    // Largeurs de colonnes
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 14 },
    ]

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    const dateStr = new Date().toISOString().slice(0, 10)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="teralite-journal-${dateStr}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
