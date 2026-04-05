import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/journal'

// PUT /api/admin/utilisateurs/[id]/toggle — activer/désactiver
export async function PUT(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: params.id } })
    if (!utilisateur) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Ne pas désactiver un Super Admin
    if (utilisateur.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Impossible de désactiver un Super Admin' }, { status: 403 })
    }

    const updated = await prisma.utilisateur.update({
      where: { id: params.id },
      data: { actif: !utilisateur.actif },
      select: { id: true, nom: true, email: true, role: true, actif: true, createdAt: true },
    })

    await logAction(session.user.id, 'UTILISATEUR_TOGGLE', {
      utilisateurId: params.id,
      nom: utilisateur.nom,
      actif: updated.actif,
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
