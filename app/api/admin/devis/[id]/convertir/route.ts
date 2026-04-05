import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/devis/[id]/convertir — convertit un devis ACCEPTE en Facture
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: { lignes: true, facture: true },
    })

    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    if (devis.statut !== 'ACCEPTE') {
      return NextResponse.json({ error: 'Le devis doit être accepté pour être converti' }, { status: 422 })
    }
    if (devis.facture) return NextResponse.json(devis.facture)

    // Calculer les montants
    const montantHT = devis.lignes.reduce((s, l) => s + l.sousTotal, 0)
    const montantTVA = devis.lignes.reduce(
      (s, l) => s + Math.round(l.sousTotal * l.tva),
      0
    )
    const montantTTC = montantHT + montantTVA

    const annee = new Date().getFullYear()
    const countFactures = await prisma.facture.count()
    const numero = `FAC-${annee}-${String(countFactures + 1).padStart(3, '0')}`

    const facture = await prisma.facture.create({
      data: { numero, devisId: params.id, montantHT, montantTVA, montantTTC },
    })

    return NextResponse.json(facture, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
