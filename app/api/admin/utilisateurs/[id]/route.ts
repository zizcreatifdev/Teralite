import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schemaUpdate = z.object({
  nom: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'VENDEUR']).optional(),
  motDePasse: z.string().min(8).max(100).optional(),
})

// PUT /api/admin/utilisateurs/[id] — modifier un compte
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const cible = await prisma.utilisateur.findUnique({ where: { id: params.id } })
    if (!cible) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Ne pas modifier un SUPER_ADMIN via cette route
    if (cible.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Impossible de modifier un Super Admin' }, { status: 403 })
    }

    const body = await request.json() as unknown
    const data = schemaUpdate.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (data.motDePasse) {
      updateData.motDePasse = await bcrypt.hash(data.motDePasse, 12)
    }
    delete updateData.motDePasse
    if (data.motDePasse) {
      updateData.motDePasse = await bcrypt.hash(data.motDePasse, 12)
    }

    const updated = await prisma.utilisateur.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, nom: true, email: true, role: true, actif: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
