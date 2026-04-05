import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/commandes/[id]/facture — crée la Facture en DB
// La génération PDF binaire est prévue en Phase 5 (@react-pdf/renderer)
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const commande = await prisma.commande.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lignes: { include: { produit: true } },
        facture: true,
      },
    })

    if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    if (commande.facture) return NextResponse.json(commande.facture)

    // Calculer les montants
    const montantHT = Math.round(commande.montantTotal / 1.18) // TVA 18% par défaut
    const montantTVA = commande.montantTotal - montantHT
    const montantTTC = commande.montantTotal

    // Générer le numéro de facture FAC-YYYY-NNN
    const annee = new Date().getFullYear()
    const countExistant = await prisma.facture.count()
    const numero = `FAC-${annee}-${String(countExistant + 1).padStart(3, '0')}`

    const facture = await prisma.facture.create({
      data: {
        numero,
        commandeId: params.id,
        montantHT,
        montantTVA,
        montantTTC,
      },
    })

    return NextResponse.json(facture, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
