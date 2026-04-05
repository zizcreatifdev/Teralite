import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TYPE_PAIEMENT_LABELS, STATUT_COMMANDE_LABELS } from '@/types/index'
import { formatDate } from '@/lib/utils'

// GET /api/admin/commandes/[id]/export — export CSV de la commande
export async function GET(
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
        zone: true,
        lignes: { include: { produit: true } },
      },
    })

    if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    const lignes = [
      ['Commande Teralite — Export'],
      [],
      ['Numéro', commande.numero],
      ['Date', formatDate(commande.createdAt)],
      ['Statut', STATUT_COMMANDE_LABELS[commande.statut]],
      ['Paiement', TYPE_PAIEMENT_LABELS[commande.typePaiement]],
      [],
      ['Client'],
      ['Nom', commande.client.nom],
      ['Téléphone', commande.client.telephone],
      ['Adresse livraison', commande.adresseLivraison ?? ''],
      ['Zone', commande.zone?.nom ?? ''],
      [],
      ['Produits', 'Réf', 'Qté', 'Prix unitaire (F)', 'Sous-total (F)'],
      ...commande.lignes.map((l) => [
        l.produit.nom,
        l.produit.reference,
        l.quantite,
        l.prixUnitaire,
        l.sousTotal,
      ]),
      [],
      ['Frais livraison (F)', commande.fraisLivraison],
      ['TOTAL (F)', commande.montantTotal],
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
        'Content-Disposition': `attachment; filename="commande-${commande.numero.replace('#', '')}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
