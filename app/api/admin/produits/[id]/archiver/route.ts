import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/produits/[id]/archiver — archive (jamais de suppression)
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const produit = await prisma.produit.findUnique({ where: { id: params.id } })
    if (!produit) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

    const updated = await prisma.produit.update({
      where: { id: params.id },
      data: { archive: true, estVedette: false },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
