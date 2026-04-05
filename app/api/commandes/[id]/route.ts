import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

  try {
    const commande = await prisma.commande.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { nom: true, telephone: true } },
        lignes: {
          include: {
            produit: {
              select: {
                nom: true,
                slug: true,
                photos: { where: { estPrincipale: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
        historique: { orderBy: { createdAt: 'asc' } },
        zone: { select: { nom: true, delaiJours: true } },
      },
    })

    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    // Ne pas exposer les champs internes admin
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { notes, vendeurId, paydunyaRef, ...safe } = commande

    return NextResponse.json(safe)
  } catch (err) {
    console.error('Erreur GET /api/commandes/[id]:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
