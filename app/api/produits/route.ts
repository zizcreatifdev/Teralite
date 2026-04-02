import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get('categorie')
  const vedette = searchParams.get('vedette')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  try {
    const produits = await prisma.produit.findMany({
      where: {
        archive: false,
        ...(categorie ? { categorie } : {}),
        ...(vedette === '1' ? { estVedette: true } : {}),
      },
      include: {
        photos: { where: { estPrincipale: true }, take: 1 },
      },
      orderBy: [{ estVedette: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    return NextResponse.json(produits, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('Erreur GET /api/produits:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
