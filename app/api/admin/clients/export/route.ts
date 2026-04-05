import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateCourte } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  PARTICULIER: 'Particulier',
  ENTREPRISE: 'Entreprise',
  MUNICIPALITE: 'Municipalité',
}

// GET /api/admin/clients/export — export CSV
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: { select: { commandes: true } },
        commandes: { select: { montantTotal: true } },
      },
      orderBy: { nom: 'asc' },
    })

    const lignes = [
      ['Nom', 'Téléphone', 'WhatsApp', 'Email', 'Adresse', 'Type', 'Commandes', 'Total dépensé (F)', 'Date création'],
      ...clients.map((c) => [
        c.nom,
        c.telephone,
        c.whatsapp ?? '',
        c.email ?? '',
        c.adresse ?? '',
        TYPE_LABELS[c.type] ?? c.type,
        c._count.commandes,
        c.commandes.reduce((s, cmd) => s + cmd.montantTotal, 0),
        formatDateCourte(c.createdAt),
      ]),
    ]

    const csv = lignes
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? '')
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(',')
      )
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
