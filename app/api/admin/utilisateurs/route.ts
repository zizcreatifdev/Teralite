import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const schemaCreate = z.object({
  nom: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'VENDEUR']), // On ne peut pas créer un SUPER_ADMIN via l'UI
  motDePasse: z.string().min(8).max(100),
})

// GET /api/admin/utilisateurs — liste tous les comptes
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        actif: true,
        createdAt: true,
        _count: { select: { commissions: true } },
      },
      orderBy: [{ role: 'asc' }, { nom: 'asc' }],
    })

    return NextResponse.json({ utilisateurs })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/utilisateurs — créer un nouveau compte
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const data = schemaCreate.parse(body)

    const existe = await prisma.utilisateur.findUnique({ where: { email: data.email } })
    if (existe) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })

    const hash = await bcrypt.hash(data.motDePasse, 12)

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: data.nom,
        email: data.email,
        role: data.role as Role,
        motDePasse: hash,
        actif: true,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        actif: true,
        createdAt: true,
        _count: { select: { commissions: true } },
      },
    })

    return NextResponse.json(utilisateur, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
