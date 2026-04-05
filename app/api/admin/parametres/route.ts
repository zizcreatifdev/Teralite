import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaBulk = z.object({
  cles: z.record(z.string(), z.string()),
})

// GET /api/admin/parametres — tous les paramètres
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const parametres = await prisma.parametres.findMany({ orderBy: { cle: 'asc' } })
    const map = Object.fromEntries(parametres.map((p) => [p.cle, p.valeur]))
    return NextResponse.json({ parametres: map })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/parametres — upsert bulk
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const { cles } = schemaBulk.parse(body)

    await Promise.all(
      Object.entries(cles).map(([cle, valeur]) =>
        prisma.parametres.upsert({
          where: { cle },
          update: { valeur },
          create: { cle, valeur },
        })
      )
    )

    // Logger l'action
    await prisma.journalActivite.create({
      data: {
        utilisateurId: session.user.id,
        action: 'PARAMETRES_MODIFIES',
        details: { cles: Object.keys(cles) },
      },
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
