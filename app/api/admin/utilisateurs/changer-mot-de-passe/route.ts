import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  nouveauMotDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(100),
})

// PATCH /api/admin/utilisateurs/changer-mot-de-passe
// Met à jour le mot de passe de l'utilisateur connecté et passe premiereConnexion à false
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const { nouveauMotDePasse } = schema.parse(body)

    const hash = await bcrypt.hash(nouveauMotDePasse, 12)

    await prisma.utilisateur.update({
      where: { id: session.user.id },
      data: {
        motDePasse: hash,
        premiereConnexion: false,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
