import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const produit = await prisma.produit.findUnique({
      where: { slug: params.slug, archive: false },
      include: {
        photos: { orderBy: [{ estPrincipale: 'desc' }, { ordre: 'asc' }] },
      },
    })

    if (!produit) {
      return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
    }

    return NextResponse.json(produit, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('Erreur GET /api/produits/[slug]:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
