import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = rateLimit(ip, 60_000, 10)
  if (!allowed) {
    return NextResponse.json(
      { error: `Trop de requêtes. Réessayez dans ${retryAfter}s.` },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'Paramètre de recherche manquant.' }, { status: 400 })
  }

  try {
    // Cherche par numéro de commande ou par téléphone du client
    const commande = await prisma.commande.findFirst({
      where: {
        OR: [
          { numero: q.startsWith('#') ? q : `#${q}` },
          { numero: q },
          { client: { telephone: q } },
        ],
      },
      include: {
        historique: {
          orderBy: { createdAt: 'asc' },
          select: { statut: true, note: true, createdAt: true },
        },
      },
    })

    if (!commande) {
      return NextResponse.json(
        { error: 'Aucune commande trouvée pour cette référence.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      numero: commande.numero,
      statut: commande.statut,
      createdAt: commande.createdAt,
      montantTotal: commande.montantTotal,
      historique: commande.historique,
    })
  } catch (err) {
    console.error('Erreur suivi commande:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
